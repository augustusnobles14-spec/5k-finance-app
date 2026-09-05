from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from dataBase import insert_movimiento

TIPO_INGRESO = "INGRESO"
TIPO_GASTO = "GASTO"
VALID_TIPOS = (TIPO_INGRESO, TIPO_GASTO)


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
    Convierte el monto a Decimal y valida que sea >= 0.
    Acepta string, int o float.
    Lanza ValueError si es inválido.
    """
    if isinstance(monto, Decimal):
        monto_decimal = monto
    elif isinstance(monto, (int, float, str)):
        try:
            monto_decimal = Decimal(str(monto).strip())
        except (InvalidOperation, AttributeError) as exc:
            raise ValueError("El monto debe ser un número válido.") from exc
    else:
        raise ValueError("El monto debe ser string, int, float o Decimal.")

    if monto_decimal < 0:
        raise ValueError("El monto no puede ser negativo.")

    return monto_decimal


def parse_momento(momento) -> datetime:
    """
    Convierte una fecha/hora en datetime.
    Acepta datetime o string ISO 8601.
    """
    if isinstance(momento, datetime):
        return momento
    if isinstance(momento, str):
        try:
            return datetime.fromisoformat(momento.strip())
        except ValueError as exc:
            raise ValueError("momento_reg debe estar en formato ISO 8601.") from exc
    raise ValueError("momento_reg debe ser string o datetime.")


def _registrar_movimiento(
    tipo_mov: str,
    monto_cop,
    fecha_str: str,
    categoria: str,
    descripcion: str = "",
    *,
    momento_reg: datetime | None = None,
    return_full: bool = False,
):
    """
    Valida datos y registra un movimiento en la base de datos.
    - tipo_mov debe ser 'INGRESO' o 'GASTO'.
    - monto_cop se convierte a Decimal y debe ser >= 0.
    - fecha_str es un string 'YYYY-MM-DD' que se convierte a date.
    - categoria:
        * si el usuario no escribe nada (string vacío o solo espacios),
          se usa por defecto 'Sin categoría'.
    - descripcion:
        * es opcional, si está vacía se guarda como "" (cadena vacía).
    Llama a insert_movimiento(...) y devuelve el ID_mov insertado.
    """
    tipo_normalizado = tipo_mov.strip().upper() if isinstance(tipo_mov, str) else ""
    if tipo_normalizado not in VALID_TIPOS:
        raise ValueError("tipo_mov debe ser 'INGRESO' o 'GASTO'.")

    monto_decimal = parse_monto(monto_cop)
    fecha = parse_fecha(fecha_str)
    momento_final = parse_momento(momento_reg) if momento_reg is not None else None

    categoria_limpia = categoria.strip() if isinstance(categoria, str) else ""
    categoria_final = categoria_limpia if categoria_limpia else "Sin categoría"

    descripcion_final = descripcion.strip() if isinstance(descripcion, str) else ""

    return insert_movimiento(
        tipo_normalizado,
        monto_decimal,
        fecha,
        categoria_final,
        descripcion_final,
        momento_reg=momento_final,
        return_full=return_full,
    )


def registrar_ingreso(
    monto_cop,
    fecha_str,
    categoria: str = "",
    descripcion: str = "",
):
    """
    Registra un movimiento de tipo INGRESO.
    Devuelve el ID_mov insertado.
    """
    return _registrar_movimiento(TIPO_INGRESO, monto_cop, fecha_str, categoria, descripcion)


def registrar_gasto(
    monto_cop,
    fecha_str,
    categoria: str = "",
    descripcion: str = "",
):
    """
    Registra un movimiento de tipo GASTO.
    Devuelve el ID_mov insertado.
    """
    return _registrar_movimiento(TIPO_GASTO, monto_cop, fecha_str, categoria, descripcion)


def registrar_movimiento(
    tipo_mov: str,
    monto_cop,
    momento_reg,
    categoria: str = "",
    descripcion: str = "",
):
    """
    Registra un movimiento con momento_reg y devuelve la fila insertada.
    - tipo_mov: string requerido ('INGRESO' o 'GASTO')
    - monto_cop: numérico >= 0
    - momento_reg: datetime o string ISO 8601; se usará para la columna momento_reg
      y también para derivar la fecha (solo fecha sin hora).
    """
    momento = parse_momento(momento_reg)
    fecha_str = momento.date().isoformat()
    return _registrar_movimiento(
        tipo_mov,
        monto_cop,
        fecha_str,
        categoria,
        descripcion,
        momento_reg=momento,
        return_full=True,
    )


# Para probar en el intérprete: importar registrar_ingreso y registrar_gasto,
# llamar con ejemplos como:
# >>> registrar_ingreso("150000", "2024-01-15", "", "Pago freelance")
# >>> registrar_gasto(50000, "2024-01-16")
