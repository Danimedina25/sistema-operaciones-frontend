import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    getWeeksOfYear,
} from '@/shared/utils/weeks';

import {
    CalendarDays,
} from 'lucide-react';

interface Props {
    value: string;

    onChange: (
        startDate: string,
        endDate: string,
    ) => void;
}

export function CommissionWeekSelector({
    value,
    onChange,
}: Props) {

    const currentYear =
        new Date().getFullYear();

    const [
        selectedYear,
        setSelectedYear,
    ] = useState(
        currentYear,
    );

    useEffect(() => {

        if (!value) {
            return;
        }

        setSelectedYear(
            new Date(value)
                .getFullYear(),
        );

    }, [value]);

    const weeks =
        useMemo(
            () =>
                getWeeksOfYear(
                    selectedYear,
                ),
            [selectedYear],
        );

    return (
        <div className="flex flex-col gap-2">

            <select
                value={selectedYear}
                className="
  w-24
  rounded-xl
  border
  border-slate-300
  bg-white
  px-3
  py-2
  text-sm
  font-medium
  shadow-sm
"
                onChange={event => {

                    const year =
                        Number(
                            event.target.value,
                        );

                    setSelectedYear(
                        year,
                    );

                    const yearWeeks =
                        getWeeksOfYear(
                            year,
                        );

                    if (
                        !yearWeeks.length
                    ) {
                        return;
                    }

                    let selectedWeek;

                    // Si es el año actual,
                    // busca la semana actual
                    if (
                        year === currentYear
                    ) {

                        const today =
                            new Date();

                        selectedWeek =
                            yearWeeks.find(
                                week => {

                                    const start =
                                        new Date(
                                            week.startDate,
                                        );

                                    const end =
                                        new Date(
                                            week.endDate,
                                        );

                                    return (
                                        today >= start &&
                                        today <= end
                                    );
                                },
                            );

                    }

                    // Si no encontró semana actual
                    // o es otro año
                    if (!selectedWeek) {

                        selectedWeek =
                            yearWeeks[
                            yearWeeks.length - 1
                            ];

                    }

                    onChange(
                        selectedWeek.startDate,
                        selectedWeek.endDate,
                    );

                }}
            >
                <option value={currentYear}>
                    {currentYear}
                </option>

                <option
                    value={
                        currentYear - 1
                    }
                >
                    {currentYear - 1}
                </option>

            </select>

            <div className="relative">

                <CalendarDays
                    size={16}
                    className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
                />

                <select
                    value={value}
                    onChange={event => {

                        const selected =
                            weeks.find(
                                week =>
                                    week.startDate ===
                                    event.target.value,
                            );

                        if (!selected) {
                            return;
                        }

                        onChange(
                            selected.startDate,
                            selected.endDate,
                        );

                    }}
                    className="
            w-[480px]
            rounded-xl
            border
            border-slate-300
            bg-white
            py-2
            pl-10
            pr-3
            text-sm
            font-medium
            shadow-sm
          "
                >

                    {weeks.map(
                        week => (

                            <option
                                key={`${selectedYear}-${week.weekNumber}`}
                                value={
                                    week.startDate
                                }
                            >
                                {week.label}
                            </option>

                        ),
                    )}

                </select>

            </div>

        </div>
    );
}