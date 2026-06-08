import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDisplayDate } from '@/shared/utils/date-formats';

export interface CommissionFiltersValues {
    startDate: string;
    endDate: string;
}

interface CommissionFiltersProps {
    filters: CommissionFiltersValues;
    onChange: (
        filters: CommissionFiltersValues,
    ) => void;
    onSubmit: (
        filters: CommissionFiltersValues,
    ) => void;
    isLoading?: boolean;
}

export function CommissionFilters({
    filters,
    onChange,
    onSubmit,
    isLoading = false,
}: CommissionFiltersProps) {
    const [
        isCalendarOpen,
        setIsCalendarOpen,
    ] = useState(false);

    const startDate =
        filters.startDate
            ? new Date(
                filters.startDate +
                'T00:00:00',
            )
            : null;

    const endDate =
        filters.endDate
            ? new Date(
                filters.endDate +
                'T00:00:00',
            )
            : null;

    const [dateRange, setDateRange] =
        useState<
            [Date | null, Date | null]
        >([
            startDate,
            endDate,
        ]);


    useEffect(() => {
        onSubmit(filters);
    }, []);

    useEffect(() => {
        setDateRange([
            startDate,
            endDate,
        ]);
    }, [
        filters.startDate,
        filters.endDate,
    ]);
    const formattedRange =
        filters.startDate &&
            filters.endDate
            ? `${formatDisplayDate(
                filters.startDate,
            )} → ${formatDisplayDate(
                filters.endDate,
            )}`
            : 'Seleccionar rango';

    return (
        <div className="space-y-4">
            <div className="relative">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Rango de fechas
                </label>

                <button
                    type="button"
                    onClick={() =>
                        setIsCalendarOpen(
                            prev => !prev,
                        )
                    }
                    className="flex min-w-[340px] items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm transition hover:border-slate-400"
                >
                    <span className="text-sm font-semibold tracking-tight text-slate-900">
                        {formattedRange}
                    </span>

                    <span>
                        {isCalendarOpen
                            ? '▲'
                            : '▼'}
                    </span>
                </button>

                {isCalendarOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                        <DatePicker
                            selectsRange
                            startDate={dateRange[0]}
                            endDate={dateRange[1]}
                            monthsShown={2}
                            inline
                            swapRange
                            shouldCloseOnSelect={false}
                            onChange={(update) => {
                                setDateRange(
                                    update as [
                                        Date | null,
                                        Date | null,
                                    ],
                                );

                                const [start, end] =
                                    update as [
                                        Date | null,
                                        Date | null,
                                    ];

                                if (!start || !end) {
                                    return;
                                }

                                const newFilters = {
                                    startDate: format(
                                        start,
                                        'yyyy-MM-dd',
                                    ),
                                    endDate: format(
                                        end,
                                        'yyyy-MM-dd',
                                    ),
                                };

                                onChange(newFilters);

                                onSubmit(newFilters);

                                setIsCalendarOpen(false);
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}