import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesService, invoicesService, expensesService, cashRegisterService } from '../api/services/billing.service';
import type { Service, Invoice, Expense } from '../types';

// Services
export const useServices = (params?: { category?: string; isActive?: boolean; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['services', params],
    queryFn: () => servicesService.findAll(params),
  });

export const useServiceCategories = () =>
  useQuery({
    queryKey: ['services', 'categories'],
    queryFn: () => servicesService.getCategories(),
  });

export const useCreateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Service>) => servicesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
};

export const useUpdateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      servicesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
};

export const useDeleteService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
};

// Invoices
export const useInvoices = (params?: { patientId?: string; status?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesService.findAll(params),
  });

export const useInvoice = (id: string) =>
  useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesService.findOne(id),
    enabled: !!id,
  });

export const useOverdueInvoices = () =>
  useQuery({
    queryKey: ['invoices', 'overdue'],
    queryFn: () => invoicesService.findOverdue(),
  });

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Invoice>) => invoicesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

export const useRefundInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesService.refund(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

// Expenses
export const useExpenses = (params?: { category?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expensesService.findAll(params),
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Expense>) => expensesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useApproveExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

// Cash Register
export const useCashRegister = () =>
  useQuery({
    queryKey: ['cash-register'],
    queryFn: () => cashRegisterService.getCurrent(),
  });

export const useOpenCashRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (openingAmount: number) => cashRegisterService.open(openingAmount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-register'] }),
  });
};

export const useCloseCashRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cashRegisterService.close(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-register'] }),
  });
};

export const useCashRegisterTransactions = (registerId?: string) =>
  useQuery({
    queryKey: ['cash-register', 'transactions', registerId],
    queryFn: () => cashRegisterService.getTransactions(registerId!),
    enabled: !!registerId,
  });

export const useAddCashRegisterTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { registerId: string; type: string; amount: number; description?: string }) =>
      cashRegisterService.addTransaction(data.registerId, {
        type: data.type,
        amount: data.amount,
        description: data.description,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-register'] });
    },
  });
};
