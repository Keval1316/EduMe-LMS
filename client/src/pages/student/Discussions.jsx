import React from 'react';
import { Link } from 'react-router-dom';
import { enrollmentApi } from '../../api/enrollmentApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Discussions = () => {
  const [loading, setLoading] = React.useState(true);
  const [courses, setCourses] = React.useState([]);

  React.useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await enrollmentApi.getEnrollments();
        // assume API returns array of enrollments with course info
        const mapped = (data || []).map((e) => e.course || e);
        setCourses(mapped);
      } catch (e) {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="mt-12 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discussions</h1>
        <p className="text-gray-600">Jump back into course discussions</p>
      </div>

      {courses.length === 0 ? (
        <p className="text-gray-600">You're not enrolled in any courses yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <Link
              key={c._id}
              to={`/course/${c._id}/discussion`}
              className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-900">{c.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discussions;
