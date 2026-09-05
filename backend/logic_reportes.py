from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

from dataBase import fetch_movimientos, fetch_todos_movimientos
from logic_registro import TIPO_GASTO, TIPO_INGRESO, VALID_TIPOS


def parse_fecha(fecha_str: str) -> date:
    """
    Convierte 'YYYY-MM-DD' a datetime.date.
    Lanza ValueError si el formato es inválido.
    """
    if not isinstance(fecha_str, str):
        raise ValueError("La fecha debe ser un string en formato 'YYYY-MM-DD'.")

    fecha_limpia = fecha_str.strip()
    try:
        return date.fromisoformat(fecha_limpia)
    except ValueError as exc:
        raise ValueError("La fecha debe tener el formato 'YYYY-MM-DD'.") from exc


def parse_monto(monto) -> Decimal:
    """
    Convierte el monto a Decimal.
    Lanza ValueError si es inválido.
    """
    if isinstance(monto, Decimal):
        return monto
    if isinstance(monto, (int, float, str)):
        try:
            return Decimal(str(monto).strip())
        except (InvalidOperation, AttributeError) as exc:
            raise ValueError("El monto debe ser un número válido.") from exc
    raise ValueError("El monto debe ser string, int, float o Decimal.")


def formatear_cop(monto: Decimal) -> str:
    """
    Devuelve el monto en formato COP legible, por ejemplo: $50,000.00 COP
    """
    monto_decimal = parse_monto(monto).quantize(Decimal("0.01"))
    return f"${monto_decimal:,.2f} COP"


def _normalizar_tipo(tipo_mov: str | None) -> str | None:
    if tipo_mov is None:
        return None
    if not isinstance(tipo_mov, str):
        raise ValueError("tipo_mov debe ser un string o None.")
    tipo = tipo_mov.strip().upper()
    if tipo and tipo not in VALID_TIPOS:
        raise ValueError("tipo_mov debe ser 'INGRESO', 'GASTO' o None.")
    return tipo or None


def listar_movimientos_rango(
    fecha_desde: str,
    fecha_hasta: str,
    categoria: str | None = None,
    tipo_mov: str | None = None,
):
    """
    Devuelve los movimientos entre fecha_desde y fecha_hasta (ambas inclusive),
    usando strings 'YYYY-MM-DD'.

    Internamente:
    - Convierte fecha_desde y fecha_hasta a date usando parse_fecha.
    - Suma 1 día a la fecha_hasta para construir fecha_fin_exclusiva.
    - Llama a fetch_movimientos(fecha_inicio=fecha_desde_date,
                               fecha_fin=fecha_hasta_exclusiva,
                               categoria=categoria,
                               tipo_mov=tipo_mov)
      respetando el rango [inicio, fin) que usa la base de datos.
    """
    fecha_inicio = parse_fecha(fecha_desde)
    fecha_fin_inclusiva = parse_fecha(fecha_hasta)
    fecha_fin_exclusiva = fecha_fin_inclusiva + timedelta(days=1)

    tipo_filtrado = _normalizar_tipo(tipo_mov)
    if isinstance(categoria, str):
        categoria_limpia = categoria.strip()
        categoria_filtrada = categoria_limpia or None
    else:
        categoria_filtrada = categoria

    return fetch_movimientos(
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin_exclusiva,
        categoria=categoria_filtrada,
        tipo_mov=tipo_filtrado,
    )


def listar_movimientos_mes(
    año: int,
    mes: int,
    categoria: str | None = None,
    tipo_mov: str | None = None,
):
    """
    Devuelve los movimientos de un mes completo.

    Internamente:
    - Valida que mes esté entre 1 y 12.
    - Calcula fecha_desde = primer día del mes (año-mes-01).
    - Calcula fecha_hasta = primer día del mes siguiente.
    - Reutiliza listar_movimientos_rango(fecha_desde, fecha_hasta - 1 día)
      o directamente construye el rango adecuado usando parse_fecha o date.
    """
    if not 1 <= mes <= 12:
        raise ValueError("El mes debe estar entre 1 y 12.")

    fecha_inicio = date(año, mes, 1)
    if mes == 12:
        fecha_fin_exclusiva = date(año + 1, 1, 1)
    else:
        fecha_fin_exclusiva = date(año, mes + 1, 1)

    tipo_filtrado = _normalizar_tipo(tipo_mov)
    if isinstance(categoria, str):
        categoria_limpia = categoria.strip()
        categoria_filtrada = categoria_limpia or None
    else:
        categoria_filtrada = categoria

    return fetch_movimientos(
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin_exclusiva,
        categoria=categoria_filtrada,
        tipo_mov=tipo_filtrado,
    )


def _calcular_resumen(movimientos):
    total_ingresos = Decimal("0")
    total_gastos = Decimal("0")

    for mov in movimientos:
        if isinstance(mov, dict):
            tipo = mov.get("tipo_mov")
            monto_val = mov.get("monto_cop")
        else:
            # Estructura desconocida; intentar atributos comunes.
            tipo = getattr(mov, "tipo_mov", None)
            monto_val = getattr(mov, "monto_cop", None)

        if tipo == TIPO_INGRESO:
            total_ingresos += parse_monto(monto_val)
        elif tipo == TIPO_GASTO:
            total_gastos += parse_monto(monto_val)

    balance = total_ingresos - total_gastos
    return total_ingresos, total_gastos, balance


def obtener_resumen_rango(
    fecha_desde: str,
    fecha_hasta: str,
    categoria: str | None = None,
):
    """
    Calcula total_ingresos, total_gastos y balance para el rango [fecha_desde, fecha_hasta],
    usando strings 'YYYY-MM-DD'.

    Internamente:
    - Usa listar_movimientos_rango(...).
    - Suma los montos con tipo_mov 'INGRESO' en total_ingresos.
    - Suma los montos con tipo_mov 'GASTO' en total_gastos.
    - Calcula balance = total_ingresos - total_gastos.

    Devuelve un diccionario con:
    - 'fecha_desde', 'fecha_hasta'
    - 'categoria'
    - 'total_ingresos', 'total_gastos', 'balance' (como Decimal)
    - 'total_ingresos_str', 'total_gastos_str', 'balance_str' (formateados con formatear_cop)
    """
    movimientos = listar_movimientos_rango(
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        categoria=categoria,
        tipo_mov=None,
    )
    total_ingresos, total_gastos, balance = _calcular_resumen(movimientos)

    return {
        "fecha_desde": fecha_desde,
        "fecha_hasta": fecha_hasta,
        "categoria": categoria,
        "total_ingresos": total_ingresos,
        "total_gastos": total_gastos,
        "balance": balance,
        "total_ingresos_str": formatear_cop(total_ingresos),
        "total_gastos_str": formatear_cop(total_gastos),
        "balance_str": formatear_cop(balance),
    }


def obtener_resumen_mes(
    año: int,
    mes: int,
    categoria: str | None = None,
):
    """
    Calcula total_ingresos, total_gastos y balance para un mes completo.

    Internamente puede:
    - reutilizar listar_movimientos_mes(...)
      o
    - construir el rango y llamar a obtener_resumen_rango usando las fechas 'YYYY-MM-DD'.

    Devuelve un diccionario similar a obtener_resumen_rango pero con 'año' y 'mes'
    en lugar de 'fecha_desde' y 'fecha_hasta'.
    """
    movimientos = listar_movimientos_mes(
        año=año,
        mes=mes,
        categoria=categoria,
        tipo_mov=None,
    )
    total_ingresos, total_gastos, balance = _calcular_resumen(movimientos)

    return {
        "año": año,
        "mes": mes,
        "categoria": categoria,
        "total_ingresos": total_ingresos,
        "total_gastos": total_gastos,
        "balance": balance,
        "total_ingresos_str": formatear_cop(total_ingresos),
        "total_gastos_str": formatear_cop(total_gastos),
        "balance_str": formatear_cop(balance),
    }


def obtener_resumen_dia(
    fecha: str,
    categoria: str | None = None,
):
    """
    Calcula el resumen (ingresos, gastos, balance) de un solo día.

    Internamente:
    - Llama a obtener_resumen_rango(fecha, fecha, categoria=categoria).
    """
    return obtener_resumen_rango(
        fecha_desde=fecha,
        fecha_hasta=fecha,
        categoria=categoria,
    )


def listar_movimientos_recientes(limit: int = 10, offset: int = 0):
    """Devuelve movimientos ordenados por momento_reg DESC con paginación básica."""
    return fetch_todos_movimientos(order_desc=True, limit=limit, offset=offset)


# Para probar en el intérprete: importar obtener_resumen_dia y llamar, por ejemplo:
# >>> from logic_reportes import obtener_resumen_dia
# >>> obtener_resumen_dia("2024-01-16")
