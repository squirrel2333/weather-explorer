from typing import List, Dict

import xarray as xr
import pandas as pd
import os
from datetime import datetime


class WeatherDataService:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.dataset = None

    def load_dataset(self):
        """
        加载 NetCDF 文件。
        关键点：使用 chunks 参数开启 Dask 集成。
        这使得 xarray 不会一次性读取 27GB 数据，而是建立索引。
        """
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"数据文件未找到: {self.data_path}")

        # chunks='auto' 或具体指定 {'time': 24} 可以优化内存
        # 这里我们假设时间维度很大，按时间分块
        self.dataset = xr.open_dataset(self.data_path, chunks={"time": 48})
        print(f"✅ 数据集加载成功: {self.data_path}")

    def query_batch(self, locations: List[Dict], vars: List[str], start_time: str, hours: int, interval: int = 1):
        """
        批量查询核心逻辑
        :param locations: List[{"lat": float, "lon": float, "id": str}]
        :param vars: List[str] 变量名列表
        :param interval: 时间步长 (例如 3 代表每3小时)
        """
        if self.dataset is None:
            raise RuntimeError("数据集未初始化")

        # 1. 校验所有变量是否存在
        missing_vars = [v for v in vars if v not in self.dataset.data_vars]
        if missing_vars:
            raise ValueError(f"以下变量不存在: {missing_vars}")

        # 2. 准备时间切片
        try:
            start_ts = pd.Timestamp(start_time)
            end_ts = start_ts + pd.Timedelta(hours=hours - 1)
        except Exception:
            raise ValueError("时间格式错误")

        # 检查时间范围
        ds_start = pd.Timestamp(self.dataset.time.values[0])
        ds_end = pd.Timestamp(self.dataset.time.values[-1])
        if start_ts < ds_start or end_ts > ds_end:
            raise ValueError(f"时间超出范围 ({ds_start} - {ds_end})")

        # 3. 性能优化：先进行时间维度的切片
        # 相比于对每个地点都切一次时间，先切时间能显著减少后续循环的数据量
        try:
            # slice(start, end) 选出范围
            # .isel(time=slice(None, None, interval)) 进行步长采样 (分辨率控制)
            time_subset = self.dataset.sel(time=slice(start_ts, end_ts))

            # 应用时间分辨率 (Resampling by step)
            # 如果 interval=3, 相当于 array[::3]
            time_subset = time_subset.isel(time=slice(None, None, interval))

            # 预加载时间轴数值 (避免循环中重复读取)
            result_times = [str(t) for t in time_subset.time.values]

        except KeyError:
            raise ValueError("时间切片失败")

        # 4. 循环处理每个地点
        results = []

        for loc in locations:
            lat = loc['lat']
            lon = loc['lon']
            loc_id = loc.get('id', f"{lat}_{lon}")

            try:
                # 空间最邻近查找
                # 注意：这里使用你之前确认正确的维度名 latitude / longitude
                point_data = time_subset.sel(
                    latitude=lat,
                    longitude=lon,
                    method="nearest",
                    tolerance=0.5
                )

                # 提取该地点下所有请求变量的数据
                loc_vars_data = []
                for var_name in vars:
                    # 提取数值并转为 list
                    values = point_data[var_name].values.tolist()
                    # 简单处理：保留2位小数
                    values = [round(float(v), 2) for v in values]

                    # 获取单位
                    unit = point_data[var_name].attrs.get("units", "unknown")

                    loc_vars_data.append({
                        "var": var_name,
                        "unit": unit,
                        "values": values  # 这里只存纯数值数组，节省传输体积
                    })

                results.append({
                    "id": loc_id,
                    "lat": lat,
                    "lon": lon,
                    "data": loc_vars_data
                })

            except KeyError:
                # 如果某个点查不到（比如在海里或者超出范围），标记错误但不中断整个批次
                results.append({
                    "id": loc_id,
                    "lat": lat,
                    "lon": lon,
                    "error": "Location out of bounds"
                })

        return {
            "start_time": str(start_ts),
            "time_steps": result_times,  # 时间轴单独返回，减少冗余
            "locations": results
        }

    def query_data(self, lat: float, lon: float, var: str, start_time: str, hours: int):
        """
        核心查询逻辑
        """
        if self.dataset is None:
            raise RuntimeError("数据集未初始化")

        # 1. 检查变量是否存在
        if var not in self.dataset.data_vars:
            available = list(self.dataset.data_vars)
            raise ValueError(f"变量 '{var}' 不存在。可用变量: {available}")

        # 2. 时间处理
        try:
            start_ts = pd.Timestamp(start_time)
            end_ts = start_ts + pd.Timedelta(hours=hours - 1)
        except Exception:
            raise ValueError("时间格式错误，请使用 ISO 格式 (e.g. 2025-06-01T12:00:00)")

        # 检查时间范围是否越界
        ds_start = pd.Timestamp(self.dataset.time.values[0])
        ds_end = pd.Timestamp(self.dataset.time.values[-1])

        if start_ts < ds_start or end_ts > ds_end:
            raise ValueError(f"查询时间超出范围。数据范围: {ds_start} 至 {ds_end}")

        # 3. 空间与时间切片 (最耗时的步骤，Xarray 会在此处优化读取)
        # method="nearest": 自动寻找最近的经纬度网格点
        try:
            # 关键修改：将 lat -> latitude, lon -> longitude
            subset = self.dataset[var].sel(
                latitude=lat,   # 对应 .nc 文件中的维度名
                longitude=lon,  # 对应 .nc 文件中的维度名
                method="nearest",
                tolerance=0.5
            ).sel(
                time=slice(start_ts, end_ts)
            )
        except KeyError as e:
            # 增加更详细的错误提示，方便排查
            print(f"DEBUG: 查找失败。尝试查找维度: latitude={lat}, longitude={lon}")
            raise ValueError(f"无法定位经纬度或时间。请确认坐标在数据范围内 (Lat:17-54, Lon:72-136)。错误: {e}")

        # 4. 获取数值与元数据
        # .values 会触发真实的磁盘读取操作
        values = subset.values
        times = subset.time.values
        unit = subset.attrs.get("units", "unknown")

        # 5. 格式化为列表
        result = []
        for t, v in zip(times, values):
            # 将 numpy 类型转换为原生 python 类型，防止序列化报错
            result.append({
                "time": str(t),
                "value": float(v)
            })

        return result, unit, str(start_ts)


# 创建一个全局实例，供 main.py 调用
# 注意：真实路径应指向你的 27G 文件，这里指向 mock 文件
weather_service = WeatherDataService("./data/2025-06-01T00_00_00_cn_flatted.nc")