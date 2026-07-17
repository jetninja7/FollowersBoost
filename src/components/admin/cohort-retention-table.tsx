'use client';

import { Card } from '@/components/ui/card';
import { CohortData } from '@/actions/analytics-advanced';
import { Calendar } from 'lucide-react';

interface CohortRetentionTableProps {
  data: CohortData[];
}

export function CohortRetentionTable({ data }: CohortRetentionTableProps) {
  const getRetentionColor = (rate: number) => {
    if (rate >= 50) return 'bg-green-100 text-green-800';
    if (rate >= 25) return 'bg-yellow-100 text-yellow-800';
    if (rate >= 10) return 'bg-orange-100 text-orange-800';
    if (rate > 0) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-400';
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-teal-600" />
        <h3 className="text-lg font-semibold">Cohort Retention Analysis</h3>
        <span className="text-sm text-gray-500 ml-auto">
          % of users who placed orders in each month
        </span>
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700 bg-gray-50">
                  Cohort
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700 bg-gray-50">
                  Size
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700 bg-blue-50">
                  M0
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700 bg-blue-50">
                  M1
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700 bg-blue-50">
                  M2
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700 bg-blue-50">
                  M3
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((cohort) => {
                const m0Rate = cohort.userCount > 0 ? (cohort.month0 / cohort.userCount) * 100 : 0;
                const m1Rate = cohort.userCount > 0 ? (cohort.month1 / cohort.userCount) * 100 : 0;
                const m2Rate = cohort.userCount > 0 ? (cohort.month2 / cohort.userCount) * 100 : 0;
                const m3Rate = cohort.userCount > 0 ? (cohort.month3 / cohort.userCount) * 100 : 0;

                return (
                  <tr key={cohort.cohortMonth} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">
                      {formatMonth(cohort.cohortMonth)}
                    </td>
                    <td className="text-center py-3 px-3 text-gray-700 font-semibold">
                      {cohort.userCount}
                    </td>
                    <td className="text-center py-3 px-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold min-w-[60px] ${getRetentionColor(
                          m0Rate
                        )}`}
                      >
                        {m0Rate > 0 ? `${m0Rate.toFixed(0)}%` : '-'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold min-w-[60px] ${getRetentionColor(
                          m1Rate
                        )}`}
                      >
                        {m1Rate > 0 ? `${m1Rate.toFixed(0)}%` : '-'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold min-w-[60px] ${getRetentionColor(
                          m2Rate
                        )}`}
                      >
                        {m2Rate > 0 ? `${m2Rate.toFixed(0)}%` : '-'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold min-w-[60px] ${getRetentionColor(
                          m3Rate
                        )}`}
                      >
                        {m3Rate > 0 ? `${m3Rate.toFixed(0)}%` : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-4 text-xs">
            <span className="text-gray-600 font-semibold">Retention:</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded ${getRetentionColor(75)}`}>50%+</span>
              <span className={`px-2 py-1 rounded ${getRetentionColor(40)}`}>25-49%</span>
              <span className={`px-2 py-1 rounded ${getRetentionColor(15)}`}>10-24%</span>
              <span className={`px-2 py-1 rounded ${getRetentionColor(5)}`}>&lt;10%</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            M0 = Registration month, M1 = 1 month after, etc. Each cell shows % of cohort users who placed orders in that month.
          </p>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">
          Not enough data for cohort analysis (requires 6+ months of user activity)
        </p>
      )}
    </Card>
  );
}
