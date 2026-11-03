import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import EventCard from '../components/EventCard';
import { Spinner, Empty, ErrorNote } from '../components/ui';

export default function Events() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/events/mine').then((r) => setEvents(r.data)).catch((e) => { setError(errMsg(e)); setEvents([]); }); }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Upcoming events</h1>
      <ErrorNote error={error} />
      {events === null ? <Spinner /> : events.length === 0 ? (
        <Empty title="No upcoming events" action={<Link to="/explore" className="btn-primary">Find communities</Link>}>
          Events from your communities will show up here. Open a community to plan one.
        </Empty>
      ) : events.map((ev) => (
        <EventCard key={ev._id} event={ev} showCommunity
          onUpdate={(u) => setEvents((l) => l.map((x) => (x._id === u._id ? { ...x, ...u } : x)))}
          onRemove={(id) => setEvents((l) => l.filter((x) => x._id !== id))} />
      ))}
    </div>
  );
}
