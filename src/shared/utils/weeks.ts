export interface WeekOption {
    weekNumber: number;
    label: string;
    startDate: string;
    endDate: string;
}

function formatDate(
    date: Date,
) {
    return `${date.getFullYear()}-${String(
        date.getMonth() + 1,
    ).padStart(2, '0')}-${String(
        date.getDate(),
    ).padStart(2, '0')}`;
}

function formatLabel(
    date: Date,
) {
    const parts =
        new Intl.DateTimeFormat(
            'es-MX',
            {
                day: '2-digit',
                month: 'short',
            },
        ).formatToParts(date);

    const day =
        parts.find(
            part => part.type === 'day',
        )?.value ?? '';

    const month =
        parts.find(
            part => part.type === 'month',
        )?.value ?? '';

    return `${day} ${month
        .replace('.', '')
        .charAt(0)
        .toUpperCase() +
        month
            .replace('.', '')
            .slice(1)
        }`;
}
export function getWeeksOfYear(
    year: number,
): WeekOption[] {

    const weeks: WeekOption[] = [];

    let current =
        new Date(year, 0, 1);

    while (
        current.getDay() !== 0
    ) {
        current.setDate(
            current.getDate() - 1,
        );
    }

    const lastDayOfYear =
        new Date(
            year,
            11,
            31,
        );

    let weekNumber = 1;

    while (
        current <= lastDayOfYear
    ) {

        const start =
            new Date(current);

        const end =
            new Date(current);

        end.setDate(
            start.getDate() + 6,
        );

        weeks.push({
            weekNumber,

            label: `Semana ${String(
                weekNumber,
            ).padStart(2, '0')} · Domingo ${formatLabel(
                start,
            )} ${start.getFullYear()} - Sábado ${formatLabel(
                end,
            )} ${end.getFullYear()}`,

            startDate:
                formatDate(start),

            endDate:
                formatDate(end),
        });

        current.setDate(
            current.getDate() + 7,
        );

        weekNumber++;
    }

    return weeks;
}