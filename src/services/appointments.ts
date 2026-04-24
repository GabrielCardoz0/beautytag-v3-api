import { Prisma } from "../generated/prisma/client";
import { appointmentsModel, EnumStatus, IQueryPaginationDateRange } from "../models/appointments";
import { servicesModel } from "../models/services";
import { ICreateAppointment } from "../routers/appointments";
import { EnumRoles } from "./middlewares/validate-role"; 
import { usersService } from "./users";

async function getAll(query: IQueryPaginationDateRange) {
  return await appointmentsModel.getAll(query);
}

async function getById(id: number) {
  const appointments = await appointmentsModel.getById(Number(id));

  if(!appointments) throw new Error("Não foi possível encontrar o agendamento solicitado.");

  return appointments;
}

async function get(user_id: number, query: IQueryPaginationDateRange) {
  return appointmentsModel.get(user_id, query);
}

async function deleteAppointments(user: { role: string, id: number }, appointment_id: number) {
  const appointment = await getById(appointment_id);
  
  if(user.role === EnumRoles.admin) {
    return appointmentsModel.delete(appointment_id);
  }

  if(!appointment) throw new Error("Reserva não encontrada.");

  if(appointment.user_id !== user.id) throw new Error("Você não ter permissão para alterar este agendamento.");

  return await appointmentsModel.delete(appointment_id);
}

async function create(user: { id: number, role: string }, payload: ICreateAppointment) {
  const { service_id, ...data } = payload;

  const service = await servicesModel.getById(service_id);

  if(!service) throw new Error("Serviço não encontrado.");

  return appointmentsModel.create({
    ...data,
    status: EnumStatus.agendado,
    user: {
      connect: {
        id: service.user_id
      }
    },
    appointments_services: {
      create: {
        service_id,
      }
    }
  });
}

async function update(user: { role: string, id: number }, appointment_id: number, payload: Prisma.appointmentsUpdateInput) {
  const appointment = await getById(appointment_id);
  
  if(user.role === EnumRoles.admin) {
    return appointmentsModel.update(appointment_id, payload);
  }

  if(appointment.user_id !== user.id) throw new Error("Você não ter permissão para alterar este agendamento.");

  return await appointmentsModel.update(appointment_id, payload);
}

async function createFromBot(params: {
  partnerId: number;
  clientNumber: string;
  serviceId: number;
  preferredAt: Date;
  durationMinutes: number;
}) {
  console.log("aqui");
  // normalizar intervalo
  const start = params.preferredAt;
  const end = new Date(start.getTime() + params.durationMinutes * 60000);

  const conflicts = await appointmentsModel.findByUserAndInterval(params.partnerId, start, end);

  if (conflicts && conflicts.length) {
    const suggestions = await appointmentsModel.findNextAvailableSlots(params.partnerId, start, params.durationMinutes, 3);
    return { success: false, message: "Horário indisponível.", suggestions };
  }

  const user = await usersService.getById(params.partnerId);

  const appointmentData: Prisma.appointmentsCreateInput = {
    start_at: start,
    end_at: end,
    status: EnumStatus.agendado,
    user: { connect: { id: params.partnerId } },
    client_name: user.name,
    client_phone: params.clientNumber,
    notes: "",
    appointments_services: {
      create: { service_id: params.serviceId }
    }
  };

  console.log(JSON.stringify(appointmentData, null, 2));

  const created = await appointmentsModel.create(appointmentData);
  console.log(create);
  return { success: true, appointment: created };
}

export const appointmentsService = {
  getAll,
  getById,
  get,
  delete: deleteAppointments,
  create,
  update,
  createFromBot
}