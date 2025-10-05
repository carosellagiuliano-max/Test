'use client';

import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Filter,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/utils';

// Mock data - in real app, this would come from Supabase
const mockStaff = [
  { id: '1', name: 'Anna Mueller', title: 'Senior Stylist', color: '#3B82F6', avatar: null },
  { id: '2', name: 'Tom Fischer', title: 'Barber', color: '#10B981', avatar: null },
  { id: '3', name: 'Lisa Weber', title: 'Color Specialist', color: '#F59E0B', avatar: null },
  { id: '4', name: 'Marc Klein', title: 'Junior Stylist', color: '#8B5CF6', avatar: null }
];

const mockServices = [
  { id: '1', name: 'Haircut & Styling', duration: 60, price: 8500 },
  { id: '2', name: 'Hair Coloring', duration: 120, price: 12000 },
  { id: '3', name: 'Beard Trim', duration: 30, price: 3500 },
  { id: '4', name: 'Hair Washing', duration: 20, price: 2500 }
];

const mockAppointments = [
  {
    id: '1',
    title: 'Maria Schmidt - Haircut',
    start: '2024-10-04T09:00:00',
    end: '2024-10-04T10:00:00',
    resourceId: '1',
    extendedProps: {
      customer: {
        name: 'Maria Schmidt',
        phone: '+41 79 123 45 67',
        email: 'maria.schmidt@email.com'
      },
      service: mockServices[0],
      status: 'confirmed',
      notes: 'Regular customer, prefers shorter layers'
    }
  },
  {
    id: '2',
    title: 'Hans Weber - Beard Trim',
    start: '2024-10-04T10:30:00',
    end: '2024-10-04T11:00:00',
    resourceId: '2',
    extendedProps: {
      customer: {
        name: 'Hans Weber',
        phone: '+41 79 234 56 78',
        email: 'hans.weber@email.com'
      },
      service: mockServices[2],
      status: 'in_progress',
      notes: 'First-time customer'
    }
  },
  {
    id: '3',
    title: 'Sarah Johnson - Hair Coloring',
    start: '2024-10-04T11:00:00',
    end: '2024-10-04T13:00:00',
    resourceId: '3',
    extendedProps: {
      customer: {
        name: 'Sarah Johnson',
        phone: '+41 79 345 67 89',
        email: 'sarah.johnson@email.com'
      },
      service: mockServices[1],
      status: 'pending',
      notes: 'Wants to go from brown to blonde'
    }
  }
];

interface CalendarFilterProps {
  staffFilter: string[];
  serviceFilter: string[];
  statusFilter: string[];
  onStaffFilterChange: (staff: string[]) => void;
  onServiceFilterChange: (services: string[]) => void;
  onStatusFilterChange: (statuses: string[]) => void;
}

function CalendarFilters({
  staffFilter,
  serviceFilter,
  statusFilter,
  onStaffFilterChange,
  onServiceFilterChange,
  onStatusFilterChange
}: CalendarFilterProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center gap-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <span className="font-medium text-gray-900">Filters:</span>

        {/* Staff Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Staff:</span>
          <select
            multiple
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={staffFilter}
            onChange={(e) => onStaffFilterChange(Array.from(e.target.selectedOptions, option => option.value))}
          >
            {mockStaff.map(staff => (
              <option key={staff.id} value={staff.id}>{staff.name}</option>
            ))}
          </select>
        </div>

        {/* Service Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Service:</span>
          <select
            multiple
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={serviceFilter}
            onChange={(e) => onServiceFilterChange(Array.from(e.target.selectedOptions, option => option.value))}
          >
            {mockServices.map(service => (
              <option key={service.id} value={service.id}>{service.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <select
            multiple
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(Array.from(e.target.selectedOptions, option => option.value))}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={() => {
            onStaffFilterChange([]);
            onServiceFilterChange([]);
            onStatusFilterChange([]);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

interface AppointmentDetailsProps {
  appointment: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}

function AppointmentDetails({ appointment, onClose, onEdit, onDelete, onStatusChange }: AppointmentDetailsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Customer Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Customer</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">{appointment.extendedProps.customer.name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">{appointment.extendedProps.customer.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">{appointment.extendedProps.customer.email}</span>
                </div>
              </div>
            </div>

            {/* Appointment Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Appointment</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">
                    {new Date(appointment.start).toLocaleDateString('de-CH')}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">
                    {formatTime(appointment.start)} - {formatTime(appointment.end)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">
                    {appointment.extendedProps.service.name} • {formatCurrency(appointment.extendedProps.service.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
              <div className="flex items-center">
                {getStatusIcon(appointment.extendedProps.status)}
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.extendedProps.status)}`}>
                  {appointment.extendedProps.status.charAt(0).toUpperCase() + appointment.extendedProps.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {appointment.extendedProps.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-700">{appointment.extendedProps.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <select
                value={appointment.extendedProps.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={onEdit}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState('resourceTimelineWeek');
  const [staffFilter, setStaffFilter] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);

  const resources = mockStaff.map(staff => ({
    id: staff.id,
    title: staff.name,
    extendedProps: {
      title: staff.title,
      color: staff.color
    }
  }));

  const filteredEvents = mockAppointments.filter(appointment => {
    if (staffFilter.length > 0 && !staffFilter.includes(appointment.resourceId)) return false;
    if (serviceFilter.length > 0 && !serviceFilter.includes(appointment.extendedProps.service.id)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(appointment.extendedProps.status)) return false;
    return true;
  });

  const handleEventClick = (clickInfo: any) => {
    setSelectedAppointment(clickInfo.event);
  };

  const handleDateSelect = (selectInfo: any) => {
    const title = prompt('Please enter appointment title:');
    if (title) {
      const newEvent = {
        id: Date.now().toString(),
        title,
        start: selectInfo.start,
        end: selectInfo.end,
        resourceId: selectInfo.resource?.id || '1'
      };
      // In real app, this would make an API call
      selectInfo.view.calendar.addEvent(newEvent);
    }
    selectInfo.view.calendar.unselect();
  };

  const handleEventDrop = (dropInfo: any) => {
    // In real app, this would make an API call to update the appointment
    console.log('Event moved:', dropInfo.event);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Calendar Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage appointments, staff scheduling, and availability
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Calendar Filters */}
      {showFilters && (
        <CalendarFilters
          staffFilter={staffFilter}
          serviceFilter={serviceFilter}
          statusFilter={statusFilter}
          onStaffFilterChange={setStaffFilter}
          onServiceFilterChange={setServiceFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {/* View Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setView('dayGridMonth')}
              className={`px-3 py-2 text-sm rounded ${view === 'dayGridMonth' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('timeGridWeek')}
              className={`px-3 py-2 text-sm rounded ${view === 'timeGridWeek' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('timeGridDay')}
              className={`px-3 py-2 text-sm rounded ${view === 'timeGridDay' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('resourceTimelineWeek')}
              className={`px-3 py-2 text-sm rounded ${view === 'resourceTimelineWeek' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Staff Timeline
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => calendarRef.current?.getApi().today()}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Today
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().prev()}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Previous
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().next()}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, resourceTimelinePlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={false}
          events={filteredEvents}
          resources={view === 'resourceTimelineWeek' ? resources : undefined}
          selectable={true}
          editable={true}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:15:00"
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
            startTime: '09:00',
            endTime: '18:00'
          }}
          locale="de-CH"
          eventDisplay="block"
          eventContent={(arg) => {
            const status = arg.event.extendedProps.status;
            const statusColor =
              status === 'completed' ? '#10B981' :
              status === 'in_progress' ? '#3B82F6' :
              status === 'cancelled' ? '#EF4444' :
              status === 'confirmed' ? '#10B981' :
              '#F59E0B';

            return (
              <div
                className="fc-event-content p-1 text-xs"
                style={{ borderLeft: `3px solid ${statusColor}` }}
              >
                <div className="font-medium">{arg.event.title}</div>
                <div className="text-xs opacity-75">
                  {formatTime(arg.event.start!)} - {formatTime(arg.event.end!)}
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onEdit={() => {
            // In real app, open edit modal
            console.log('Edit appointment:', selectedAppointment);
            setSelectedAppointment(null);
          }}
          onDelete={() => {
            // In real app, make delete API call
            console.log('Delete appointment:', selectedAppointment);
            setSelectedAppointment(null);
          }}
          onStatusChange={(status) => {
            // In real app, make API call to update status
            console.log('Update status:', status);
            selectedAppointment.setExtendedProp('status', status);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}