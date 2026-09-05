from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from logic_registro import (
    TIPO_GASTO,
    TIPO_INGRESO,
    registrar_gasto,
    registrar_ingreso,
    registrar_movimiento,
)
from logic_reportes import (
    obtener_resumen_dia,
    obtener_resumen_mes,
    obtener_resumen_rango,
    listar_movimientos_rango,
    listar_movimientos_recientes,
)


app = FastAPI(title="5k API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
        "http://127.0.0.1:5173",
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"mensaje": "5k API corriendo. Ve a /docs"}


class MovimientoCrear(BaseModel):
    monto_cop: float = Field(..., ge=0, description="Monto en pesos colombianos.")
    fecha: date = Field(..., description="Fecha en formato YYYY-MM-DD.")
    categoria: Optional[str] = Field(
        default=None, description="Categoría opcional del movimiento."
    )
    descripcion: Optional[str] = Field(
        default=None, description="Descripción opcional del movimiento."
    )


class MovimientoCreado(BaseModel):
    id_mov: int
    tipo_mov: str
    mensaje: str


class MovimientoCrearGenerico(BaseModel):
    tipo: str = Field(..., description="Tipo de movimiento (INGRESO o GASTO).")
    monto: float = Field(..., ge=0, description="Monto en pesos colombianos.")
    descripcion: Optional[str] = Field(default="", description="Descripción opcional.")
    categoria: Optional[str] = Field(
        default=None, description="Categoría opcional del movimiento."
    )
    momento_reg: datetime = Field(
        ..., description="Fecha y hora de registro en formato ISO 8601."
    )


class MovimientoDetalle(BaseModel):
    id_mov: int
    tipo: str
    monto: float
    descripcion: Optional[str] = None
    categoria: str
    fecha: date
    momento_reg: datetime


class RespuestaBase(BaseModel):
    status: str = "success"


class MovimientoCreadoResponse(RespuestaBase):
    data: MovimientoDetalle


class MovimientosListadoResponse(RespuestaBase):
    data: list[MovimientoDetalle]


class ResumenBase(BaseModel):
    total_ingresos: float
    total_gastos: float
    balance: float
    total_ingresos_str: str
    total_gastos_str: str
    balance_str: str


class ResumenDiaResponse(ResumenBase):
    fecha: date
    categoria: Optional[str] = None


class ResumenMesResponse(ResumenBase):
    año: int
    mes: int
    categoria: Optional[str] = None


class ResumenRangoResponse(ResumenBase):
    fecha_desde: date
    fecha_hasta: date
    categoria: Optional[str] = None


class MovimientoItem(BaseModel):
    ID_mov: int
    fecha: date
    tipo_mov: str
    monto_cop: float
    categoria: str
    momento_reg: datetime 
    descripcion: Optional[str] = None


def _decimal_a_float(valor):
    if isinstance(valor, Decimal):
        return float(valor)
    return valor


def _fecha_desde_respuesta(valor) -> date:
    if isinstance(valor, date):
        return valor
    if isinstance(valor, str):
        return date.fromisoformat(valor)
    raise ValueError("La fecha devuelta por la lógica es inválida.")


def _resumen_comun(data: dict) -> dict:
    return {
        "total_ingresos": _decimal_a_float(data.get("total_ingresos", 0)),
        "total_gastos": _decimal_a_float(data.get("total_gastos", 0)),
        "balance": _decimal_a_float(data.get("balance", 0)),
        "total_ingresos_str": data.get("total_ingresos_str", ""),
        "total_gastos_str": data.get("total_gastos_str", ""),
        "balance_str": data.get("balance_str", ""),
    }


def _mapear_resumen_dia(data: dict) -> dict:
    return {
        "fecha": _fecha_desde_respuesta(
            data.get("fecha") or data.get("fecha_desde") or data.get("fecha_hasta")
        ),
        "categoria": data.get("categoria"),
        **_resumen_comun(data),
    }


def _mapear_resumen_rango(data: dict) -> dict:
    return {
        "fecha_desde": _fecha_desde_respuesta(data.get("fecha_desde")),
        "fecha_hasta": _fecha_desde_respuesta(data.get("fecha_hasta")),
        "categoria": data.get("categoria"),
        **_resumen_comun(data),
    }


def _mapear_resumen_mes(data: dict) -> dict:
    return {
        "año": data.get("año"),
        "mes": data.get("mes"),
        "categoria": data.get("categoria"),
        **_resumen_comun(data),
    }


def _mapear_movimiento(mov: dict) -> dict:
    return {
        "ID_mov": mov.get("ID_mov") or mov.get("id_mov") or getattr(mov, "ID_mov", None),
        "fecha": mov.get("fecha") or getattr(mov, "fecha", None),
        "tipo_mov": mov.get("tipo_mov") or getattr(mov, "tipo_mov", None),
        "monto_cop": _decimal_a_float(mov.get("monto_cop") or getattr(mov, "monto_cop", 0)),
        "categoria": mov.get("categoria") or getattr(mov, "categoria", ""),
        "descripcion": mov.get("descripcion") or getattr(mov, "descripcion", None),
        "momento_reg": mov.get("momento_reg") or getattr(mov, "momento_reg", None),
    }


def _mapear_movimiento_respuesta(mov: dict) -> dict:
    base = _mapear_movimiento(mov)
    return {
        "id_mov": base["ID_mov"],
        "tipo": base["tipo_mov"],
        "monto": base["monto_cop"],
        "descripcion": base["descripcion"],
        "categoria": base["categoria"],
        "fecha": base["fecha"],
        "momento_reg": base["momento_reg"],
    }


def _manejar_error(exc: Exception) -> None:
    raise HTTPException(
        status_code=400,
        detail={"status": "error", "message": str(exc)},
    )


@app.post("/movimientos", response_model=MovimientoCreadoResponse)
async def crear_movimiento(movimiento: MovimientoCrearGenerico):
    try:
        nuevo_mov = registrar_movimiento(
            tipo_mov=movimiento.tipo,
            monto_cop=movimiento.monto,
            momento_reg=movimiento.momento_reg,
            categoria=movimiento.categoria or "",
            descripcion=movimiento.descripcion or "",
        )
        return {"status": "success", "data": _mapear_movimiento_respuesta(nuevo_mov)}
    except (ValueError, RuntimeError) as exc:
        _manejar_error(exc)


@app.get("/movimientos", response_model=MovimientosListadoResponse)
async def listar_movimientos(
    limit: int = Query(10, ge=1, le=100, description="Cantidad de movimientos a traer."),
    offset: int = Query(0, ge=0, description="Desplazamiento para paginación."),
):
    try:
        movimientos = listar_movimientos_recientes(limit=limit, offset=offset)
        data = [_mapear_movimiento_respuesta(mov) for mov in movimientos]
        return {"status": "success", "data": data}
    except (ValueError, RuntimeError) as exc:
        _manejar_error(exc)


@app.post("/movimientos/ingreso", response_model=MovimientoCreado)
async def crear_ingreso(movimiento: MovimientoCrear):
    try:
        nuevo_id = registrar_ingreso(
            monto_cop=movimiento.monto_cop,
            fecha_str=movimiento.fecha.isoformat(),
            categoria=movimiento.categoria or "",
            descripcion=movimiento.descripcion or "",
        )
        return {
            "id_mov": nuevo_id,
            "tipo_mov": TIPO_INGRESO,
            "mensaje": "Ingreso registrado correctamente.",
        }
    except (ValueError, RuntimeError) as exc:
        _manejar_error(exc)


@app.post("/movimientos/gasto", response_model=MovimientoCreado)
async def crear_gasto(movimiento: MovimientoCrear):
    try:
        nuevo_id = registrar_gasto(
            monto_cop=movimiento.monto_cop,
            fecha_str=movimiento.fecha.isoformat(),
            categoria=movimiento.categoria or "",
            descripcion=movimiento.descripcion or "",
        )
        return {
            "id_mov": nuevo_id,
            "tipo_mov": TIPO_GASTO,
            "mensaje": "Gasto registrado correctamente.",
        }
    except (ValueError, RuntimeError) as exc:
        _manejar_error(exc)


@app.get("/resumen/dia", response_model=ResumenDiaResponse)
async def resumen_dia(
    fecha: date = Query(..., description="Fecha del resumen en formato YYYY-MM-DD."),
    categoria: Optional[str] = Query(None, description="Categoría opcional a filtrar."),
):
    try:
        data = obtener_resumen_dia(fecha=fecha.isoformat(), categoria=categoria)
        return _mapear_resumen_dia(data)
    except (ValueError, RuntimeError) as exc:
        _manejar_error(exc)


@app.get("/resumen/mes", response_model=ResumenMesResponse)
async def resumen_mes(
    año: int = Query(..., description="Año en formato numérico, por ejemplo 2024."),
    mes: int = Query(..., ge=1, le=12, description="Mes numérico (1-12)."),
    categoria: Optional[str] = Query(None, description="Categoría opcional a filtrar."),
):
    try:
        data = obtener_resumen_mes(año=año, mes=mes, categoria=categoria)
        return _mapear_resumen_mes(data)
    except (ValueError, RuntimeError) as exc:
        _manejar_error(exc)


@app.get("/resumen/rango", response_model=ResumenRangoResponse)
async def resumen_rango(
    fecha_desde: date = Query(..., description="Fecha de inicio en formato YYYY-MM-DD."),
    fecha_hasta: date = Query(..., description="Fecha fin en formato YYYY-MM-DD."),
    categoria: Optional[str] = Query(None, description="Categoría opcional a filtrar."),
):
    try:
        data = obtener_resumen_rango(
            fecha_desde=fecha_desde.isoformat(),
            fecha_hasta=fecha_hasta.isoformat(),
            categoria=categoria,
        )
        return _mapear_resumen_rango(data)
    except (ValueError, RuntimeError) as exc:
        _manejar_error(exc)


@app.get("/movimientos/rango", response_model=list[MovimientoItem])
async def movimientos_rango(
    fecha_desde: date = Query(..., description="Fecha de inicio en formato YYYY-MM-DD."),
    fecha_hasta: date = Query(..., description="Fecha fin en formato YYYY-MM-DD."),
    categoria: Optional[str] = Query(None, description="Categoría opcional a filtrar."),
    tipo_mov: Optional[str] = Query(
        None,
        description="Tipo de movimiento a filtrar (INGRESO o GASTO).",
    ),
):
    try:
        movimientos = listar_movimientos_rango(
            fecha_desde=fecha_desde.isoformat(),
            fecha_hasta=fecha_hasta.isoformat(),
            categoria=categoria,
            tipo_mov=tipo_mov,
        )
        return [_mapear_movimiento(mov) for mov in movimientos]
    except (ValueError, RuntimeError) as exc:
        _manejar_error(exc)
