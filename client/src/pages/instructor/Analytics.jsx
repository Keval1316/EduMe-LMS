import React from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Stat = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="text-sm text-gray-600">{label}</div>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
  </div>
);

const Analytics = () => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardApi.getInstructorDashboard();
        setData(res.data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="mt-12 flex justify-center"><LoadingSpinner /></div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const totalStudents = data?.totalStudents ?? 0;
  const totalCourses = data?.totalCourses ?? 0;
  const totalRevenue = data?.totalRevenue ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Overview of your instructor performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Total Students" value={totalStudents} />
        <Stat label="Total Courses" value={totalCourses} />
        <Stat label="Total Revenue" value={`$${Number(totalRevenue).toLocaleString()}`} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Top Courses</h2>
        <div className="divide-y">
          {(data?.topCourses || []).map((c) => (
            <div key={c._id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{c.title}</div>
                <div className="text-sm text-gray-600">{c.enrollments} enrollments</div>
              </div>
              <div className="text-sm text-gray-700">Revenue: ${Number(c.revenue || 0).toLocaleString()}</div>
            </div>
          ))}
          {(data?.topCourses || []).length === 0 && (
            <div className="text-gray-600">No data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
