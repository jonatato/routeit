import type { ItineraryDocumentDetailsByType, ItineraryDocumentType } from '../services/documents';

type DocumentDetailFieldsProps = {
  type: ItineraryDocumentType;
  detailsByType: ItineraryDocumentDetailsByType;
  onChange: (type: ItineraryDocumentType, patch: Record<string, string>) => void;
  idPrefix: string;
  disabled?: boolean;
};

const formatDateInputValue = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 10);
};

const formatDateTimeInputValue = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 16);
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  const hours = `${parsed.getHours()}`.padStart(2, '0');
  const minutes = `${parsed.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function DocumentDetailFields({
  type,
  detailsByType,
  onChange,
  idPrefix,
  disabled = false,
}: DocumentDetailFieldsProps) {
  const details = detailsByType[type];

  const update = (field: string, value: string) => {
    onChange(type, { [field]: value });
  };

  const inputClassName = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';

  switch (type) {
    case 'passport':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-passport-holder`} className="text-sm font-medium">Titular</label>
            <input
              id={`${idPrefix}-passport-holder`}
              value={details.holder_name ?? ''}
              onChange={event => update('holder_name', event.target.value)}
              className={inputClassName}
              placeholder="Nombre como aparece en el pasaporte"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-passport-number`} className="text-sm font-medium">Numero de documento</label>
            <input
              id={`${idPrefix}-passport-number`}
              value={details.document_number ?? ''}
              onChange={event => update('document_number', event.target.value)}
              className={inputClassName}
              placeholder="AA1234567"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-passport-nationality`} className="text-sm font-medium">Nacionalidad</label>
            <input
              id={`${idPrefix}-passport-nationality`}
              value={details.nationality ?? ''}
              onChange={event => update('nationality', event.target.value)}
              className={inputClassName}
              placeholder="Espana"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-passport-country`} className="text-sm font-medium">Pais emisor</label>
            <input
              id={`${idPrefix}-passport-country`}
              value={details.issuing_country ?? ''}
              onChange={event => update('issuing_country', event.target.value)}
              className={inputClassName}
              placeholder="Espana"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-passport-birth`} className="text-sm font-medium">Fecha de nacimiento</label>
            <input
              id={`${idPrefix}-passport-birth`}
              type="date"
              value={formatDateInputValue(details.date_of_birth)}
              onChange={event => update('date_of_birth', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-passport-issued`} className="text-sm font-medium">Fecha de emision</label>
            <input
              id={`${idPrefix}-passport-issued`}
              type="date"
              value={formatDateInputValue(details.issued_on)}
              onChange={event => update('issued_on', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-passport-expires`} className="text-sm font-medium">Fecha de expiracion</label>
            <input
              id={`${idPrefix}-passport-expires`}
              type="date"
              value={formatDateInputValue(details.expires_on)}
              onChange={event => update('expires_on', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
        </div>
      );

    case 'flight':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-flight-passenger`} className="text-sm font-medium">Pasajero</label>
            <input
              id={`${idPrefix}-flight-passenger`}
              value={details.passenger_name ?? ''}
              onChange={event => update('passenger_name', event.target.value)}
              className={inputClassName}
              placeholder="Nombre del pasajero"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-airline`} className="text-sm font-medium">Aerolinea</label>
            <input
              id={`${idPrefix}-flight-airline`}
              value={details.airline ?? ''}
              onChange={event => update('airline', event.target.value)}
              className={inputClassName}
              placeholder="Iberia"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-number`} className="text-sm font-medium">Numero de vuelo</label>
            <input
              id={`${idPrefix}-flight-number`}
              value={details.flight_number ?? ''}
              onChange={event => update('flight_number', event.target.value)}
              className={inputClassName}
              placeholder="IB281"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-departure-airport`} className="text-sm font-medium">Aeropuerto salida</label>
            <input
              id={`${idPrefix}-flight-departure-airport`}
              value={details.departure_airport ?? ''}
              onChange={event => update('departure_airport', event.target.value)}
              className={inputClassName}
              placeholder="MAD"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-arrival-airport`} className="text-sm font-medium">Aeropuerto llegada</label>
            <input
              id={`${idPrefix}-flight-arrival-airport`}
              value={details.arrival_airport ?? ''}
              onChange={event => update('arrival_airport', event.target.value)}
              className={inputClassName}
              placeholder="NRT"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-departure-at`} className="text-sm font-medium">Sale</label>
            <input
              id={`${idPrefix}-flight-departure-at`}
              type="datetime-local"
              value={formatDateTimeInputValue(details.departure_at)}
              onChange={event => update('departure_at', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-arrival-at`} className="text-sm font-medium">Llega</label>
            <input
              id={`${idPrefix}-flight-arrival-at`}
              type="datetime-local"
              value={formatDateTimeInputValue(details.arrival_at)}
              onChange={event => update('arrival_at', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-terminal`} className="text-sm font-medium">Terminal</label>
            <input
              id={`${idPrefix}-flight-terminal`}
              value={details.terminal ?? ''}
              onChange={event => update('terminal', event.target.value)}
              className={inputClassName}
              placeholder="T4"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-gate`} className="text-sm font-medium">Puerta</label>
            <input
              id={`${idPrefix}-flight-gate`}
              value={details.gate ?? ''}
              onChange={event => update('gate', event.target.value)}
              className={inputClassName}
              placeholder="H23"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-seat`} className="text-sm font-medium">Asiento</label>
            <input
              id={`${idPrefix}-flight-seat`}
              value={details.seat ?? ''}
              onChange={event => update('seat', event.target.value)}
              className={inputClassName}
              placeholder="12A"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-flight-class`} className="text-sm font-medium">Clase</label>
            <input
              id={`${idPrefix}-flight-class`}
              value={details.travel_class ?? ''}
              onChange={event => update('travel_class', event.target.value)}
              className={inputClassName}
              placeholder="Economy"
              disabled={disabled}
            />
          </div>
        </div>
      );

    case 'hotel':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-hotel-property`} className="text-sm font-medium">Alojamiento</label>
            <input
              id={`${idPrefix}-hotel-property`}
              value={details.property_name ?? ''}
              onChange={event => update('property_name', event.target.value)}
              className={inputClassName}
              placeholder="Hotel Shinjuku"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-hotel-address`} className="text-sm font-medium">Direccion</label>
            <input
              id={`${idPrefix}-hotel-address`}
              value={details.address ?? ''}
              onChange={event => update('address', event.target.value)}
              className={inputClassName}
              placeholder="Direccion del hotel"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-hotel-guest`} className="text-sm font-medium">Huesped</label>
            <input
              id={`${idPrefix}-hotel-guest`}
              value={details.guest_name ?? ''}
              onChange={event => update('guest_name', event.target.value)}
              className={inputClassName}
              placeholder="Nombre del titular"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-hotel-room`} className="text-sm font-medium">Tipo de habitacion</label>
            <input
              id={`${idPrefix}-hotel-room`}
              value={details.room_type ?? ''}
              onChange={event => update('room_type', event.target.value)}
              className={inputClassName}
              placeholder="Doble, twin, suite..."
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-hotel-checkin`} className="text-sm font-medium">Check-in</label>
            <input
              id={`${idPrefix}-hotel-checkin`}
              type="date"
              value={formatDateInputValue(details.check_in_on)}
              onChange={event => update('check_in_on', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-hotel-checkout`} className="text-sm font-medium">Check-out</label>
            <input
              id={`${idPrefix}-hotel-checkout`}
              type="date"
              value={formatDateInputValue(details.check_out_on)}
              onChange={event => update('check_out_on', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-hotel-board`} className="text-sm font-medium">Regimen</label>
            <input
              id={`${idPrefix}-hotel-board`}
              value={details.board_type ?? ''}
              onChange={event => update('board_type', event.target.value)}
              className={inputClassName}
              placeholder="Solo alojamiento, desayuno incluido..."
              disabled={disabled}
            />
          </div>
        </div>
      );

    case 'insurance':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-insurance-provider`} className="text-sm font-medium">Aseguradora</label>
            <input
              id={`${idPrefix}-insurance-provider`}
              value={details.provider ?? ''}
              onChange={event => update('provider', event.target.value)}
              className={inputClassName}
              placeholder="AXA"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-insurance-policy`} className="text-sm font-medium">Numero de poliza</label>
            <input
              id={`${idPrefix}-insurance-policy`}
              value={details.policy_number ?? ''}
              onChange={event => update('policy_number', event.target.value)}
              className={inputClassName}
              placeholder="POL-12345"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-insurance-insured`} className="text-sm font-medium">Asegurado</label>
            <input
              id={`${idPrefix}-insurance-insured`}
              value={details.insured_person ?? ''}
              onChange={event => update('insured_person', event.target.value)}
              className={inputClassName}
              placeholder="Persona cubierta"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-insurance-start`} className="text-sm font-medium">Inicio cobertura</label>
            <input
              id={`${idPrefix}-insurance-start`}
              type="date"
              value={formatDateInputValue(details.coverage_start_on)}
              onChange={event => update('coverage_start_on', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-insurance-end`} className="text-sm font-medium">Fin cobertura</label>
            <input
              id={`${idPrefix}-insurance-end`}
              type="date"
              value={formatDateInputValue(details.coverage_end_on)}
              onChange={event => update('coverage_end_on', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-insurance-phone`} className="text-sm font-medium">Telefono asistencia</label>
            <input
              id={`${idPrefix}-insurance-phone`}
              value={details.assistance_phone ?? ''}
              onChange={event => update('assistance_phone', event.target.value)}
              className={inputClassName}
              placeholder="+34 ..."
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-insurance-contact`} className="text-sm font-medium">Contacto emergencia</label>
            <input
              id={`${idPrefix}-insurance-contact`}
              value={details.emergency_contact ?? ''}
              onChange={event => update('emergency_contact', event.target.value)}
              className={inputClassName}
              placeholder="Nombre y telefono"
              disabled={disabled}
            />
          </div>
        </div>
      );

    case 'ground_transport':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-ground-mode`} className="text-sm font-medium">Medio</label>
            <select
              id={`${idPrefix}-ground-mode`}
              value={details.transport_mode ?? ''}
              onChange={event => update('transport_mode', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            >
              <option value="">Selecciona</option>
              <option value="train">Tren</option>
              <option value="bus">Bus</option>
              <option value="ferry">Ferry</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-ground-operator`} className="text-sm font-medium">Operador</label>
            <input
              id={`${idPrefix}-ground-operator`}
              value={details.operator_name ?? ''}
              onChange={event => update('operator_name', event.target.value)}
              className={inputClassName}
              placeholder="Renfe, ALSA, JR..."
              disabled={disabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-ground-passenger`} className="text-sm font-medium">Pasajero</label>
            <input
              id={`${idPrefix}-ground-passenger`}
              value={details.passenger_name ?? ''}
              onChange={event => update('passenger_name', event.target.value)}
              className={inputClassName}
              placeholder="Nombre del pasajero"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-ground-from`} className="text-sm font-medium">Salida</label>
            <input
              id={`${idPrefix}-ground-from`}
              value={details.departure_location ?? ''}
              onChange={event => update('departure_location', event.target.value)}
              className={inputClassName}
              placeholder="Atocha"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-ground-to`} className="text-sm font-medium">Llegada</label>
            <input
              id={`${idPrefix}-ground-to`}
              value={details.arrival_location ?? ''}
              onChange={event => update('arrival_location', event.target.value)}
              className={inputClassName}
              placeholder="Sants"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-ground-departure-at`} className="text-sm font-medium">Sale</label>
            <input
              id={`${idPrefix}-ground-departure-at`}
              type="datetime-local"
              value={formatDateTimeInputValue(details.departure_at)}
              onChange={event => update('departure_at', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-ground-arrival-at`} className="text-sm font-medium">Llega</label>
            <input
              id={`${idPrefix}-ground-arrival-at`}
              type="datetime-local"
              value={formatDateTimeInputValue(details.arrival_at)}
              onChange={event => update('arrival_at', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-ground-seat`} className="text-sm font-medium">Asiento o plaza</label>
            <input
              id={`${idPrefix}-ground-seat`}
              value={details.seat ?? ''}
              onChange={event => update('seat', event.target.value)}
              className={inputClassName}
              placeholder="12B"
              disabled={disabled}
            />
          </div>
        </div>
      );

    case 'car_rental':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-car-company`} className="text-sm font-medium">Compania</label>
            <input
              id={`${idPrefix}-car-company`}
              value={details.company_name ?? ''}
              onChange={event => update('company_name', event.target.value)}
              className={inputClassName}
              placeholder="Hertz"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-car-confirmation`} className="text-sm font-medium">Confirmacion</label>
            <input
              id={`${idPrefix}-car-confirmation`}
              value={details.confirmation_number ?? ''}
              onChange={event => update('confirmation_number', event.target.value)}
              className={inputClassName}
              placeholder="CONF-123"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-car-driver`} className="text-sm font-medium">Conductor principal</label>
            <input
              id={`${idPrefix}-car-driver`}
              value={details.driver_name ?? ''}
              onChange={event => update('driver_name', event.target.value)}
              className={inputClassName}
              placeholder="Nombre del conductor"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-car-pickup-location`} className="text-sm font-medium">Recogida</label>
            <input
              id={`${idPrefix}-car-pickup-location`}
              value={details.pickup_location ?? ''}
              onChange={event => update('pickup_location', event.target.value)}
              className={inputClassName}
              placeholder="Aeropuerto de Narita"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-car-dropoff-location`} className="text-sm font-medium">Devolucion</label>
            <input
              id={`${idPrefix}-car-dropoff-location`}
              value={details.dropoff_location ?? ''}
              onChange={event => update('dropoff_location', event.target.value)}
              className={inputClassName}
              placeholder="Shibuya"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-car-pickup-at`} className="text-sm font-medium">Recogida fecha/hora</label>
            <input
              id={`${idPrefix}-car-pickup-at`}
              type="datetime-local"
              value={formatDateTimeInputValue(details.pickup_at)}
              onChange={event => update('pickup_at', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-car-dropoff-at`} className="text-sm font-medium">Devolucion fecha/hora</label>
            <input
              id={`${idPrefix}-car-dropoff-at`}
              type="datetime-local"
              value={formatDateTimeInputValue(details.dropoff_at)}
              onChange={event => update('dropoff_at', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-car-vehicle`} className="text-sm font-medium">Vehiculo</label>
            <input
              id={`${idPrefix}-car-vehicle`}
              value={details.vehicle_type ?? ''}
              onChange={event => update('vehicle_type', event.target.value)}
              className={inputClassName}
              placeholder="Compacto, SUV, hibrido..."
              disabled={disabled}
            />
          </div>
        </div>
      );

    case 'other':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-other-owner`} className="text-sm font-medium">Titular</label>
            <input
              id={`${idPrefix}-other-owner`}
              value={details.owner_name ?? ''}
              onChange={event => update('owner_name', event.target.value)}
              className={inputClassName}
              placeholder="Persona titular"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-other-issuer`} className="text-sm font-medium">Emisor</label>
            <input
              id={`${idPrefix}-other-issuer`}
              value={details.issuer ?? ''}
              onChange={event => update('issuer', event.target.value)}
              className={inputClassName}
              placeholder="Entidad emisora"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-other-valid-from`} className="text-sm font-medium">Valido desde</label>
            <input
              id={`${idPrefix}-other-valid-from`}
              type="date"
              value={formatDateInputValue(details.valid_from_on)}
              onChange={event => update('valid_from_on', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-other-valid-until`} className="text-sm font-medium">Valido hasta</label>
            <input
              id={`${idPrefix}-other-valid-until`}
              type="date"
              value={formatDateInputValue(details.valid_until_on)}
              onChange={event => update('valid_until_on', event.target.value)}
              className={inputClassName}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor={`${idPrefix}-other-notes`} className="text-sm font-medium">Notas</label>
            <textarea
              id={`${idPrefix}-other-notes`}
              value={details.notes ?? ''}
              onChange={event => update('notes', event.target.value)}
              className={`${inputClassName} min-h-28`}
              placeholder="Observaciones utiles sobre este documento"
              disabled={disabled}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

export default DocumentDetailFields;