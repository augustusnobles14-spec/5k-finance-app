import os
from datetime import date
from decimal import Decimal

from logic_registro import registrar_gasto, registrar_ingreso
from logic_reportes import (
    listar_movimientos_rango,
    obtener_resumen_dia,
    obtener_resumen_mes,
    obtener_resumen_rango,
)


def limpiar_pantalla():
    os.system("cls" if os.name == "nt" else "clear")


def pausar():
    input("Presiona ENTER para continuar...")


def pedir_fecha_con_default(mensaje: str, usar_hoy_por_defecto: bool = True) -> str:
    hoy_str = date.today().isoformat()
    while True:
        if usar_hoy_por_defecto:
            valor = input(f"{mensaje} (ENTER para hoy {hoy_str}): ").strip()
            if valor == "":
                return hoy_str
            return valor
        valor = input(f"{mensaje}: ").strip()
        if valor:
            return valor
        print("La fecha no puede estar vacía. Intenta de nuevo.")


def pedir_monto() -> str:
    return input("Monto en COP (solo número, sin $ ni comas): ").strip()


def pedir_categoria() -> str:
    return input("Categoría (ENTER para 'Sin categoría'): ").strip()


def pedir_descripcion() -> str:
    return input("Descripción (opcional, ENTER para dejar vacío): ").strip()


def imprimir_resumen(resumen: dict, titulo: str):
    print("=" * 50)
    print(titulo)
    print("-" * 50)

    if "fecha_desde" in resumen and "fecha_hasta" in resumen:
        print(f"Rango: {resumen['fecha_desde']} a {resumen['fecha_hasta']}")
    elif "año" in resumen and "mes" in resumen:
        print(f"Año: {resumen['año']}  Mes: {resumen['mes']}")

    categoria = resumen.get("categoria")
    print(f"Categoría: {categoria if categoria else 'Todas'}")

    ingresos = resumen.get("total_ingresos_str") or str(resumen.get("total_ingresos", ""))
    gastos = resumen.get("total_gastos_str") or str(resumen.get("total_gastos", ""))
    balance = resumen.get("balance_str") or str(resumen.get("balance", ""))

    print(f"Ingresos: {ingresos}")
    print(f"Gastos:   {gastos}")
    print(f"Balance:  {balance}")
    print("=" * 50)


def manejar_registrar_ingreso():
    limpiar_pantalla()
    print("=== Registrar INGRESO ===")
    monto = pedir_monto()
    fecha_str = pedir_fecha_con_default("Fecha [YYYY-MM-DD]", usar_hoy_por_defecto=True)
    categoria = pedir_categoria()
    descripcion = pedir_descripcion()
    try:
        id_mov = registrar_ingreso(monto, fecha_str, categoria, descripcion)
        print(f"Ingreso registrado con ID: {id_mov}")
    except Exception as exc:  # noqa: BLE001
        print(f"Error al registrar ingreso: {exc}")
    pausar()


def manejar_registrar_gasto():
    limpiar_pantalla()
    print("=== Registrar GASTO ===")
    monto = pedir_monto()
    fecha_str = pedir_fecha_con_default("Fecha [YYYY-MM-DD]", usar_hoy_por_defecto=True)
    categoria = pedir_categoria()
    descripcion = pedir_descripcion()
    try:
        id_mov = registrar_gasto(monto, fecha_str, categoria, descripcion)
        print(f"Gasto registrado con ID: {id_mov}")
    except Exception as exc:  # noqa: BLE001
        print(f"Error al registrar gasto: {exc}")
    pausar()


def manejar_resumen_hoy():
    limpiar_pantalla()
    print("=== Resumen de HOY ===")
    hoy_str = date.today().isoformat()
    try:
        resumen = obtener_resumen_dia(hoy_str)
        imprimir_resumen(resumen, f"Resumen de {hoy_str}")
    except Exception as exc:  # noqa: BLE001
        print(f"Error al obtener el resumen de hoy: {exc}")
    pausar()


def manejar_resumen_mes_actual():
    limpiar_pantalla()
    print("=== Resumen del MES ACTUAL ===")
    hoy = date.today()
    try:
        resumen = obtener_resumen_mes(hoy.year, hoy.month)
        imprimir_resumen(resumen, f"Resumen de {hoy.year}-{hoy.month:02d}")
    except Exception as exc:  # noqa: BLE001
        print(f"Error al obtener el resumen del mes: {exc}")
    pausar()


def manejar_resumen_rango():
    limpiar_pantalla()
    print("=== Resumen por RANGO ===")
    fecha_desde = pedir_fecha_con_default("Fecha desde [YYYY-MM-DD]", usar_hoy_por_defecto=False)
    fecha_hasta = pedir_fecha_con_default("Fecha hasta [YYYY-MM-DD]", usar_hoy_por_defecto=False)
    categoria_in = input("Categoría (ENTER para todas): ").strip()
    categoria = categoria_in if categoria_in else None
    try:
        resumen = obtener_resumen_rango(fecha_desde, fecha_hasta, categoria=categoria)
        imprimir_resumen(resumen, f"Resumen de {fecha_desde} a {fecha_hasta}")
    except Exception as exc:  # noqa: BLE001
        print(f"Error al obtener el resumen del rango: {exc}")
    pausar()


def _formatear_monto_simple(monto_val) -> str:
    try:
        monto_decimal = Decimal(str(monto_val))
        return f"{monto_decimal:,.2f}"
    except Exception:  # noqa: BLE001
        return str(monto_val)


def manejar_ver_movimientos_rango():
    limpiar_pantalla()
    print("=== Movimientos por RANGO ===")
    fecha_desde = pedir_fecha_con_default("Fecha desde [YYYY-MM-DD]", usar_hoy_por_defecto=False)
    fecha_hasta = pedir_fecha_con_default("Fecha hasta [YYYY-MM-DD]", usar_hoy_por_defecto=False)
    categoria_in = input("Categoría (ENTER para todas): ").strip()
    categoria = categoria_in if categoria_in else None
    try:
        movimientos = listar_movimientos_rango(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            categoria=categoria,
            tipo_mov=None,
        )
        if not movimientos:
            print("No hay movimientos en ese rango de fechas.")
        else:
            print("ID | Fecha | Tipo | Monto | Categoría | Descripción")
            print("-" * 70)
            for mov in movimientos:
                id_mov = mov.get("ID_mov") if isinstance(mov, dict) else getattr(mov, "ID_mov", "")
                fecha = mov.get("fecha") if isinstance(mov, dict) else getattr(mov, "fecha", "")
                tipo = mov.get("tipo_mov") if isinstance(mov, dict) else getattr(mov, "tipo_mov", "")
                monto_val = mov.get("monto_cop") if isinstance(mov, dict) else getattr(mov, "monto_cop", "")
                categoria_mov = mov.get("categoria") if isinstance(mov, dict) else getattr(mov, "categoria", "")
                descripcion = mov.get("descripcion") if isinstance(mov, dict) else getattr(mov, "descripcion", "")
                monto_str = _formatear_monto_simple(monto_val)
                print(f"{id_mov} | {fecha} | {tipo} | {monto_str} | {categoria_mov} | {descripcion}")
    except Exception as exc:  # noqa: BLE001
        print(f"Error al listar movimientos: {exc}")
    pausar()


def mostrar_menu():
    limpiar_pantalla()
    print("=== Menú principal 5k ===")
    print("1) Registrar INGRESO")
    print("2) Registrar GASTO")
    print("3) Ver resumen de HOY")
    print("4) Ver resumen del MES ACTUAL")
    print("5) Ver resumen por RANGO de fechas")
    print("6) Ver movimientos por RANGO de fechas")
    print("7) Salir")


def main():
    while True:
        mostrar_menu()
        opcion = input("Selecciona una opción (1-7): ").strip()
        if opcion == "1":
            manejar_registrar_ingreso()
        elif opcion == "2":
            manejar_registrar_gasto()
        elif opcion == "3":
            manejar_resumen_hoy()
        elif opcion == "4":
            manejar_resumen_mes_actual()
        elif opcion == "5":
            manejar_resumen_rango()
        elif opcion == "6":
            manejar_ver_movimientos_rango()
        elif opcion == "7":
            print("¡Gracias por usar 5k! Hasta pronto.")
            break
        else:
            print("Opción inválida. Intenta de nuevo.")
            pausar()


if __name__ == "__main__":
    main()
