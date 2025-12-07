from typing import List, Dict
import xarray as xr
import pandas as pd
import os
from datetime import datetime


class WeatherDataService:
    def __init__(self):
        # 优先从环境变量 WEATHER_DATA_PATH 获取（Docker 环境）
        # 如果没有环境变量，则使用默认的本地开发路径（Local 环境）
        default_local_path = "./data/2025-06-01T00_00_00_cn_flatted.nc"
        self.data_path = os.getenv("WEATHER_DATA_PATH", default_local_path)

        self.dataset = None
        print(f"服务初始化，目标数据路径: {self.data_path}")

    def load_dataset(self):
        """
        加载 NetCDF 文件。
        """
        if not os.path.exists(self.data_path):
            # 打印详细调试信息，帮助排查 Docker 路径挂载问题
            print(f"错误: 文件未找到: {self.data_path}")
            print(f"当前目录 ({os.getcwd()}) 下的文件: {os.listdir('.')}")
            # 如果是在根目录下，尝试看看 /data 里面有什么
            if os.path.exists('/data'):
                print(f"/data 目录下的文件: {os.listdir('/data')}")

            raise FileNotFoundError(f"数据文件未找到: {self.data_path}")

        # chunks='auto' 或具体指定 {'time': 24} 可以优化内存
        self.dataset = xr.open_dataset(self.data_path, chunks={"time": 48})
        print(f"数据集加载成功: {self.data_path}")

    def query_batch(self, locations: List[Dict], vars: List[str], start_time: str, hours: int, interval: int = 1):
        """
        批量查询
        """
        if self.dataset is None:
            try:
                print("检测到数据集未初始化，尝试立即加载...")
                self.load_dataset()
            except Exception as e:
                raise RuntimeError(f"数据集未初始化且加载失败: {str(e)}")

        # 校验所有变量是否存在
        missing_vars = [v for v in vars if v not in self.dataset.data_vars]
        if missing_vars:
            raise ValueError(f"以下变量不存在: {missing_vars}")

        # 准备时间切片
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

        # 先进行时间维度的切片
        try:
            # 格式化时间，去除纳秒，确保 JSON 序列化友好
            time_subset = self.dataset.sel(time=slice(start_ts, end_ts))
            time_subset = time_subset.isel(time=slice(None, None, interval))

            result_times = [pd.Timestamp(t).isoformat(timespec='seconds') + "Z" for t in time_subset.time.values]

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
                point_data = time_subset.sel(
                    latitude=lat,
                    longitude=lon,
                    method="nearest",
                    tolerance=0.5
                )

                # 提取该地点下所有请求变量的数据
                loc_vars_data = []
                for var_name in vars:
                    values = point_data[var_name].values.tolist()
                    values = [round(float(v), 2) for v in values]

                    unit = point_data[var_name].attrs.get("units", "unknown")
                    # 这里可以加入你的单位清洗逻辑 clean_unit(unit)

                    loc_vars_data.append({
                        "var": var_name,
                        "unit": unit,
                        "values": values
                    })

                results.append({
                    "id": loc_id,
                    "lat": lat,
                    "lon": lon,
                    "data": loc_vars_data
                })

            except KeyError:
                results.append({
                    "id": loc_id,
                    "lat": lat,
                    "lon": lon,
                    "error": "Location out of bounds"
                })

        return {
            "start_time": str(start_ts),
            "time_steps": result_times,
            "locations": results
        }

    def query_data(self, lat: float, lon: float, var: str, start_time: str, hours: int):
        if self.dataset is None:
            # 尝试自动加载
            try:
                self.load_dataset()
            except Exception as e:
                raise RuntimeError(f"数据集未初始化: {str(e)}")

        if var not in self.dataset.data_vars:
            raise ValueError(f"变量 '{var}' 不存在")

        start_ts = pd.Timestamp(start_time)
        end_ts = start_ts + pd.Timedelta(hours=hours - 1)

        subset = self.dataset[var].sel(
            latitude=lat, longitude=lon, method="nearest", tolerance=0.5
        ).sel(time=slice(start_ts, end_ts))

        values = subset.values
        times = subset.time.values
        unit = subset.attrs.get("units", "unknown")

        result = []
        for t, v in zip(times, values):
            result.append({"time": str(t), "value": float(v)})

        return result, unit, str(start_ts)

weather_service = WeatherDataService()