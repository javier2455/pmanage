import { defineSuite, expect } from "@/testing/harness";
import {
  endOfWeekSunday,
  fromLocalDateString,
  resolvePresetRange,
  startOfWeekMonday,
  toLocalDateString,
} from "@/lib/date-range";

/** Fecha local sin ambigüedad de zona horaria (el constructor por partes es local). */
function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

export const dateRangeSuite = defineSuite(
  "date-range · rangos por preset",
  ({ test }) => {
    test(
      "toLocalDateString usa los componentes locales, no el instante UTC",
      () => {
        // Una fecha local a medianoche: con toISOString() al oeste de Greenwich
        // esto se serializaría como el día anterior.
        expect(toLocalDateString(localDate(2026, 7, 24))).toBe("2026-07-24");
        expect(toLocalDateString(localDate(2026, 1, 1))).toBe("2026-01-01");
        expect(toLocalDateString(localDate(2026, 12, 31))).toBe("2026-12-31");
      },
      "El backend interpreta yyyy-MM-dd como día local completo. Serializar con toISOString() convertiría a UTC y desplazaría la fecha un día en zonas negativas como America/Havana, que es la del negocio.",
    );

    test(
      "toLocalDateString rellena mes y día a dos dígitos",
      () => {
        expect(toLocalDateString(localDate(2026, 3, 5))).toBe("2026-03-05");
      },
      "Sin padding el backend recibiría '2026-3-5', que no casa con el formato esperado.",
    );

    test(
      "fromLocalDateString es la inversa de toLocalDateString",
      () => {
        const parsed = fromLocalDateString("2026-07-24");
        expect(parsed !== null).toBe(true);
        expect(toLocalDateString(parsed as Date)).toBe("2026-07-24");
      },
      "Ida y vuelta sin pérdida: la fecha que se envía es la que se muestra.",
    );

    test(
      "fromLocalDateString rechaza formatos y fechas imposibles",
      () => {
        expect(fromLocalDateString("no-es-fecha")).toBeNull();
        expect(fromLocalDateString("2026-7-24")).toBeNull();
        // JS desbordaría el 30 de febrero al 2 de marzo en vez de fallar.
        expect(fromLocalDateString("2026-02-30")).toBeNull();
        expect(fromLocalDateString("2026-13-01")).toBeNull();
      },
      "Devolver null permite al llamador caer al preset en vez de consultar con una fecha inválida.",
    );

    test(
      "la semana va de lunes a domingo",
      () => {
        // 2026-07-24 es viernes.
        const friday = localDate(2026, 7, 24);
        expect(toLocalDateString(startOfWeekMonday(friday))).toBe("2026-07-20");
        expect(toLocalDateString(endOfWeekSunday(friday))).toBe("2026-07-26");
      },
      "Es el caso concreto de la revisión: estando a 24 de julio de 2026 el filtro debe mostrar la semana del 20 al 26.",
    );

    test(
      "el domingo pertenece a la semana que termina, no a la que empieza",
      () => {
        // 2026-07-26 es domingo: su semana sigue siendo la del 20.
        const sunday = localDate(2026, 7, 26);
        expect(toLocalDateString(startOfWeekMonday(sunday))).toBe("2026-07-20");
        expect(toLocalDateString(endOfWeekSunday(sunday))).toBe("2026-07-26");
      },
      "getDay() devuelve 0 para domingo; sin el ajuste (day+6)%7 el domingo saltaría a la semana siguiente.",
    );

    test(
      "el lunes es su propio inicio de semana",
      () => {
        const monday = localDate(2026, 7, 20);
        expect(toLocalDateString(startOfWeekMonday(monday))).toBe("2026-07-20");
      },
      "Caso borde del cálculo de desplazamiento.",
    );

    test(
      "una semana puede cruzar el cambio de mes",
      () => {
        // 2026-08-01 es sábado: su semana empieza el lunes 27 de julio.
        const saturday = localDate(2026, 8, 1);
        expect(toLocalDateString(startOfWeekMonday(saturday))).toBe(
          "2026-07-27",
        );
        expect(toLocalDateString(endOfWeekSunday(saturday))).toBe("2026-08-02");
      },
      "El desplazamiento por días se apoya en el constructor Date, que normaliza el desbordamiento entre meses.",
    );

    test(
      "una semana puede cruzar el cambio de año",
      () => {
        // 2027-01-01 es viernes: su semana empieza el lunes 28 de diciembre.
        const newYear = localDate(2027, 1, 1);
        expect(toLocalDateString(startOfWeekMonday(newYear))).toBe(
          "2026-12-28",
        );
        expect(toLocalDateString(endOfWeekSunday(newYear))).toBe("2027-01-03");
      },
      "Igual que el cambio de mes, pero además cambia el año: es donde suelen fallar los cálculos hechos a mano.",
    );

    test(
      "el preset de semana devuelve el rango completo",
      () => {
        expect(resolvePresetRange("week", localDate(2026, 7, 24))).toEqual({
          startDate: "2026-07-20",
          endDate: "2026-07-26",
        });
      },
      "El rango es la semana entera, no 'hasta hoy': es lo que se muestra rotulado en el filtro.",
    );

    test(
      "el preset de mes abarca del día 1 al último día",
      () => {
        expect(resolvePresetRange("month", localDate(2026, 7, 15))).toEqual({
          startDate: "2026-07-01",
          endDate: "2026-07-31",
        });
      },
      "El fin se calcula como el día 0 del mes siguiente, que JS resuelve al último día real.",
    );

    test(
      "el preset de mes resuelve la longitud real de febrero",
      () => {
        expect(resolvePresetRange("month", localDate(2026, 2, 10))).toEqual({
          startDate: "2026-02-01",
          endDate: "2026-02-28",
        });
        // 2028 es bisiesto.
        expect(resolvePresetRange("month", localDate(2028, 2, 10))).toEqual({
          startDate: "2028-02-01",
          endDate: "2028-02-29",
        });
      },
      "Evita el clásico fallo de asumir 30 o 31 días, y cubre el año bisiesto.",
    );

    test(
      "el preset de trimestre cubre los tres meses del trimestre en curso",
      () => {
        // Q3 = julio, agosto, septiembre.
        expect(resolvePresetRange("quarter", localDate(2026, 8, 5))).toEqual({
          startDate: "2026-07-01",
          endDate: "2026-09-30",
        });
        // Q1 desde enero.
        expect(resolvePresetRange("quarter", localDate(2026, 2, 5))).toEqual({
          startDate: "2026-01-01",
          endDate: "2026-03-31",
        });
        // Q4 termina en diciembre, sin desbordar de año.
        expect(resolvePresetRange("quarter", localDate(2026, 11, 5))).toEqual({
          startDate: "2026-10-01",
          endDate: "2026-12-31",
        });
      },
      "El último trimestre es el caso que desborda al año siguiente en el cálculo del fin de mes.",
    );

    test(
      "el preset de año cubre el año natural",
      () => {
        expect(resolvePresetRange("year", localDate(2026, 7, 24))).toEqual({
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        });
      },
      "Rango del 1 de enero al 31 de diciembre del año de la fecha de referencia.",
    );

    test(
      "el preset personalizado parte del mes en curso",
      () => {
        expect(resolvePresetRange("custom", localDate(2026, 7, 24))).toEqual({
          startDate: "2026-07-01",
          endDate: "2026-07-31",
        });
      },
      "'custom' no tiene rango propio: el usuario lo elige, así que se ofrece el mes en curso como punto de partida del selector.",
    );
  },
  {
    description:
      "Cálculo de rangos de fecha por preset (semana, mes, trimestre, año) y serialización local a yyyy-MM-dd.",
  },
);
