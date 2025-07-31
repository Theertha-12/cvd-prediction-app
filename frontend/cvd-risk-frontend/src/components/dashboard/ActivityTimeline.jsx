import React from 'react';
import { formatDate } from '../../utils/helpers';

const ActivityTimeline = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-5 h-5" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      {activity.description}{' '}
                      <span className="font-medium text-gray-900">
                        {activity.target}
                      </span>
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={activity.date}>{formatDate(activity.date)}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityTimeline;
