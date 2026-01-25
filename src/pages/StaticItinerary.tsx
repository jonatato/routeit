import ItineraryView from '../components/ItineraryView';
import { chinaTrip } from '../data/itinerary';

function StaticItinerary() {
  return <ItineraryView itinerary={chinaTrip} />;
}

export default StaticItinerary;
