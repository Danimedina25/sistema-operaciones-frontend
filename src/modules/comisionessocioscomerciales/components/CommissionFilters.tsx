import { useEffect, useState } from 'react';

import {
    formatDisplayDate,
} from '@/shared/utils/date-formats';

import {
    CommissionWeekSelector,
} from './CommissionWeekSelector';

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

    useEffect(() => {
        onSubmit(filters);
    }, []);


    return (
        <div className="w-full min-w-0 max-w-full space-y-4">
            <div className="w-full min-w-0 max-w-full">
                <CommissionWeekSelector
                    value={filters.startDate}
                    onChange={(
                        startDate,
                        endDate,
                    ) => {

                        const newFilters = {
                            startDate,
                            endDate,
                        };

                        onChange(
                            newFilters,
                        );

                        void onSubmit(
                            newFilters,
                        );
                    }}
                />
            </div>
        </div>
    );
}
