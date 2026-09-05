"""
Módulo de conexión y operaciones básicas sobre la base de datos PostgreSQL.
Solo requiere editar la URL de conexión en get_connection().
"""
import os 
from dotenv import load_dotenv

from datetime import date, datetime
from typing import Dict, List, Optional

import psycopg
from psycopg import sql
from psycopg.rows import dict_row

load_dotenv()

def get_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("Falta DATABASE_URL en .env o en variables de entorno")
    return psycopg.connect(db_url, row_factory=dict_row)

def init_db() -> None:
    """Crea la tabla movimientos si no existe."""
    create_table = sql.SQL(
        """
        CREATE TABLE IF NOT EXISTS movimientos (
            ID_mov          SERIAL PRIMARY KEY,
            tipo_mov        VARCHAR(10) NOT NULL CHECK (tipo_mov IN ('INGRESO', 'GASTO')),
            monto_cop       NUMERIC(14,2) NOT NULL CHECK (monto_cop >= 0),
            fecha           DATE NOT NULL,
            categoria       TEXT NOT NULL,
            descripcion     TEXT,
            momento_reg     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(create_table)
            conn.commit()
    except psycopg.Error as exc:
        # Re-lanza con contexto para que la CLI pueda mostrar un mensaje claro.
        raise RuntimeError(f"Error inicializando la base de datos: {exc}") from exc


def insert_movimiento(
    tipo_mov: str,
    monto_cop: float,
    fecha: date,
    categoria: str,
    descripcion: Optional[str] = None,
    *,
    momento_reg: Optional[datetime] = None,
    return_full: bool = False,
):
    """
    Inserta un movimiento y devuelve el ID_mov o la fila completa si return_full=True.

    Si se envía momento_reg, se usa en vez del valor por defecto de la BD.
    """
    columnas = ["tipo_mov", "monto_cop", "fecha", "categoria", "descripcion"]
    params: list = [tipo_mov, monto_cop, fecha, categoria, descripcion]

    if momento_reg is not None:
        columnas.append("momento_reg")
        params.append(momento_reg)

    placeholders = ", ".join(["%s"] * len(columnas))
    columnas_sql = ", ".join(columnas)
    returning_clause = (
        "ID_mov, tipo_mov, monto_cop, fecha, categoria, descripcion, momento_reg"
        if return_full
        else "ID_mov"
    )
    insert_sql = sql.SQL(
        f"""
        INSERT INTO movimientos ({columnas_sql})
        VALUES ({placeholders})
        RETURNING {returning_clause};
        """
    )

    try:
        cursor_factory = dict_row if return_full else None
        with get_connection() as conn:
            with conn.cursor(row_factory=cursor_factory) as cur:
                cur.execute(insert_sql, params)
                result = cur.fetchone()
            conn.commit()
            if return_full:
                return dict(result)
            return result[0]
    except psycopg.Error as exc:
        raise RuntimeError(f"Error insertando movimiento: {exc}") from exc


def fetch_movimientos(
    fecha_inicio: date,
    fecha_fin: date,
    categoria: Optional[str] = None,
    tipo_mov: Optional[str] = None,
) -> List[Dict]:
    """Obtiene movimientos en el rango de fechas, opcionalmente filtrando por categoría y tipo."""
    base_query = [
        "SELECT ID_mov, tipo_mov, monto_cop, fecha, categoria, descripcion, momento_reg",
        "FROM movimientos",
        "WHERE fecha >= %s AND fecha < %s",
    ]
    params: List = [fecha_inicio, fecha_fin]

    if categoria:
        base_query.append("AND categoria = %s")
        params.append(categoria)

    if tipo_mov:
        base_query.append("AND tipo_mov = %s")
        params.append(tipo_mov)

    base_query.append("ORDER BY fecha ASC, ID_mov ASC")
    query_str = " ".join(base_query)

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(query_str, params)
                rows = cur.fetchall()
                return [dict(row) for row in rows]
    except psycopg.Error as exc:
        raise RuntimeError(f"Error consultando movimientos: {exc}") from exc


def fetch_todos_movimientos(
    order_desc: bool = True,
    limit: int = 10,
    offset: int = 0,
) -> List[Dict]:
    """
    Devuelve todos los movimientos ordenados por momento_reg.
    order_desc=True los devuelve del más reciente al más antiguo.
    """
    orden = "DESC" if order_desc else "ASC"
    query_str = f"""
        SELECT ID_mov, tipo_mov, monto_cop, fecha, categoria, descripcion, momento_reg
        FROM movimientos
        ORDER BY momento_reg {orden}, ID_mov {orden}
        LIMIT %s OFFSET %s
    """
    params: List = [limit, offset]

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(query_str, params)
                rows = cur.fetchall()
                return [dict(row) for row in rows]
    except psycopg.Error as exc:
        raise RuntimeError(f"Error consultando movimientos: {exc}") from exc
