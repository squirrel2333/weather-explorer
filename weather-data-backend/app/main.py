from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.service import weather_service
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="气象数据查询服务")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境建议改为 ["http://localhost:3001"]
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法，包括 OPTIONS
    allow_headers=["*"],  # 允许所有 Header
)


# --- 定义请求体模型 ---
class WeatherRequest(BaseModel):
    lat: float
    lon: float
    time: str  # 例如: "2025-06-02T00:00:00"
    var: str  # 例如: "t2m"
    hours: Optional[int] = 24


# --- 定义响应体模型 ---
class TimeValue(BaseModel):
    time: str
    value: float


class WeatherResponse(BaseModel):
    lat: float
    lon: float
    var: str
    unit: str
    start_time: str
    values: List[TimeValue]


# --- 事件钩子 ---
@app.on_event("startup")
async def startup_event():
    """服务启动时加载数据"""
    try:
        weather_service.load_dataset()
    except Exception as e:
        print(f"❌ 数据加载失败: {e}")


# --- API 路由 ---
@app.post("/weather", response_model=WeatherResponse)
async def get_weather_data(req: WeatherRequest):
    try:
        # 调用服务层
        values, unit, start_time_str = weather_service.query_data(
            lat=req.lat,
            lon=req.lon,
            var=req.var,
            start_time=req.time,
            hours=req.hours
        )

        return {
            "lat": req.lat,
            "lon": req.lon,
            "var": req.var,
            "unit": unit,
            "start_time": start_time_str,
            "values": values
        }

    except ValueError as e:
        # 捕获业务逻辑错误 (如变量不存在、时间越界)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 捕获服务器内部未知错误
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.get("/")
def health_check():
    return {"status": "running", "data_loaded": weather_service.dataset is not None}


# app/main.py

# ... (保留原有的引用) ...
from typing import List, Optional, Union
from pydantic import BaseModel, Field


# --- 新增：批处理请求模型 ---
class LocationItem(BaseModel):
    lat: float
    lon: float
    id: Optional[str] = None  # 客户端自定义ID，方便回溯


class BatchWeatherRequest(BaseModel):
    locations: List[LocationItem]
    time: str
    vars: List[str]
    hours: int = 24
    interval: int = Field(1, ge=1, description="时间间隔(小时)，默认为1")

    class Config:
        schema_extra = {
            "example": {
                "locations": [
                    {"lat": 30.5, "lon": 120.5, "id": "hangzhou"},
                    {"lat": 39.9, "lon": 116.4, "id": "beijing"}
                ],
                "time": "2025-06-01T12:00:00",
                "vars": ["t2m", "u10", "tp6h"],
                "hours": 12,
                "interval": 3
            }
        }


# --- 新增：批处理响应模型 ---
class VarDataSimple(BaseModel):
    var: str
    unit: str
    values: List[float]  # 纯数值列表，对应外层的时间轴


class LocationResult(BaseModel):
    id: Optional[str]
    lat: float
    lon: float
    data: Optional[List[VarDataSimple]] = None
    error: Optional[str] = None


class BatchWeatherResponse(BaseModel):
    start_time: str
    time_steps: List[str]  # 公共的时间轴
    locations: List[LocationResult]


# ... (保留原有的 startup_event 和 /weather 接口) ...

# --- 新增：批量查询接口 ---
@app.post("/weather/batch", response_model=BatchWeatherResponse)
async def get_weather_batch(req: BatchWeatherRequest):
    try:
        # 将 locations model 转换为 list of dict 传给 service
        locs_dict = [loc.dict() for loc in req.locations]

        result = weather_service.query_batch(
            locations=locs_dict,
            vars=req.vars,
            start_time=req.time,
            hours=req.hours,
            interval=req.interval
        )

        # 补充单位逻辑 (如果nc文件里没读到，用我们之前的映射表兜底)
        # 注意：这里需要在 service 返回后做一次后处理，或者在 service 里调用 get_unit_for_var
        # 为了简单，假设 service 里已经尽力获取了单位

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")