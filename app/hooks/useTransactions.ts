import { useState, useCallback } from "react";

import { transactionsApi, Transaction } from "../api/transactions";

import { useLocale } from "@/components/providers/LocaleProvider";



export const useTransactions = () => {

  const { t } = useLocale();

  const messages = t.dashboard.transactions.errors;



  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [totalPages, setTotalPages] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);

  const [totalItems, setTotalItems] = useState(0);



  const getTransactions = useCallback(async (params: {

    page?: number;

    per_page?: number;

    branch_id?: number;

    destination_branch_id?: number;

    status?: string;

    start_date?: string;

    end_date?: string;

    id?: string;

    sender?: string;

    receiver?: string;

  }) => {

    try {

      setLoading(true);

      setError(null);

      const response = await transactionsApi.getTransactions(params);

      setTransactions(response.items);

      setTotalPages(response.total_pages);

      setCurrentPage(response.page);

      setTotalItems(response.total);

    } catch (e) {

      setError(e instanceof Error ? e.message : messages.fetch);

    } finally {

      setLoading(false);

    }

  }, [messages.fetch]);



  const createTransaction = useCallback(async (transaction: Omit<Transaction, "id">) => {

    try {

      setLoading(true);

      setError(null);

      const response = await transactionsApi.createTransaction(transaction);

      return response;

    } catch (e) {

      setError(e instanceof Error ? e.message : messages.create);

      throw e;

    } finally {

      setLoading(false);

    }

  }, [messages.create]);



  const getTransaction = useCallback(async (id: string) => {

    try {

      setLoading(true);

      setError(null);

      const response = await transactionsApi.getTransaction(id);

      return response;

    } catch (e) {

      setError(e instanceof Error ? e.message : messages.get);

      throw e;

    } finally {

      setLoading(false);

    }

  }, [messages.get]);



  const markAsReceived = useCallback(async (data: {

    transaction_id: string;

    receiver: string;

    receiver_mobile: string;

    receiver_id: string;

    receiver_address: string;

    receiver_governorate: string;

  }) => {

    try {

      setLoading(true);

      setError(null);

      const response = await transactionsApi.markAsReceived(data);

      return response;

    } catch (e) {

      setError(e instanceof Error ? e.message : messages.markReceived);

      throw e;

    } finally {

      setLoading(false);

    }

  }, [messages.markReceived]);



  const updateStatus = useCallback(async (data: {

    transaction_id: string;

    status: string;

  }) => {

    try {

      setLoading(true);

      setError(null);

      const response = await transactionsApi.updateStatus(data);

      return response;

    } catch (e) {

      setError(e instanceof Error ? e.message : messages.status);

      throw e;

    } finally {

      setLoading(false);

    }

  }, [messages.status]);



  return {

    loading,

    error,

    transactions,

    totalPages,

    currentPage,

    totalItems,

    getTransactions,

    createTransaction,

    getTransaction,

    markAsReceived,

    updateStatus,

  };

};

