import { useMemo, useState } from 'react';

import {
    getWeeksOfYear,
} from '@/shared/utils/weeks';
import { CalendarDays } from 'lucide-react';

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
    ] = useState(currentYear);

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
                onChange={event =>
                    setSelectedYear(
                        Number(
                            event.target.value,
                        ),
                    )
                }
                className="
          w-[160px]
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
      absolute
      left-3
      top-1/2
      -translate-y-1/2
      text-slate-400
      pointer-events-none
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
      pl-10
      pr-3
      py-2
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