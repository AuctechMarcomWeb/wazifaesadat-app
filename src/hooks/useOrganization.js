import { useState, useCallback } from 'react';
import {
  getOfficeBearers,
  getOfficeBearerById,
  createOfficeBearer,
  updateOfficeBearer,
  deleteOfficeBearer,
  getOrganizationStructures,
  getOrganizationStructureById,
  createOrganizationStructure,
  updateOrganizationStructure,
  deleteOrganizationStructure,
  getExecutiveMembers,
  getExecutiveMemberById,
  createExecutiveMember,
  updateExecutiveMember,
  deleteExecutiveMember,
  getLocalSecretaries,
  getLocalSecretaryById,
  createLocalSecretary,
  updateLocalSecretary,
  deleteLocalSecretary,
} from '../api/organization';

export const useOrganizationStructures = () => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadStructures = useCallback(async (pageNum = 1, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const result = await getOrganizationStructures(pageNum, 10, search);
      if (result.success) {
        setStructures(result.structures);
        setTotal(result.total);
        setPage(pageNum);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createStructure = useCallback(
    async data => {
      try {
        setLoading(true);
        const result = await createOrganizationStructure(data);
        if (result.success) {
          await loadStructures(1);
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [loadStructures],
  );

  const updateStructure = useCallback(
    async (id, data) => {
      try {
        setLoading(true);
        const result = await updateOrganizationStructure(id, data);
        if (result.success) {
          await loadStructures(page);
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [page, loadStructures],
  );

  const deleteStructure = useCallback(
    async id => {
      try {
        setLoading(true);
        const result = await deleteOrganizationStructure(id);
        if (result.success) {
          await loadStructures(page);
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [page, loadStructures],
  );

  return {
    structures,
    loading,
    error,
    page,
    total,
    loadStructures,
    createStructure,
    updateStructure,
    deleteStructure,
  };
};

/**
 * Custom hook for Office Bearer management
 */
export const useOfficeBearers = () => {
  const [bearers, setBearers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadBearers = useCallback(async (pageNum = 1, limit = 50, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const result = await getOfficeBearers(pageNum, limit, search);
      if (result.success) {
        if (pageNum === 1) {
          setBearers(result.bearers);
        } else {
          setBearers(prev => [...prev, ...result.bearers]);
        }
        setTotal(result.total);
        setPage(pageNum);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBearer = useCallback(
    async data => {
      try {
        setLoading(true);
        const result = await createOfficeBearer(data);
        if (result.success) {
          await loadBearers(1, 50, '');
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [loadBearers],
  );

  const updateBearer = useCallback(
    async (id, data) => {
      try {
        setLoading(true);
        const result = await updateOfficeBearer(id, data);
        if (result.success) {
          await loadBearers(page, 50, '');
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [page, loadBearers],
  );

  const deleteBearer = useCallback(
    async id => {
      try {
        setLoading(true);
        const result = await deleteOfficeBearer(id);
        if (result.success) {
          await loadBearers(page, 50, '');
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [page, loadBearers],
  );

  return {
    bearers,
    loading,
    error,
    page,
    total,
    loadBearers,
    createBearer,
    updateBearer,
    deleteBearer,
  };
};

/**
 * Custom hook for Executive Members management
 */
export const useExecutiveMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadMembers = useCallback(
    async (pageNum = 1, limit = 50, search = '') => {
      try {
        setLoading(true);
        setError(null);
        const result = await getExecutiveMembers(pageNum, limit, search);
        if (result.success) {
          if (pageNum === 1) {
            setMembers(result.members);
          } else {
            setMembers(prev => [...prev, ...result.members]);
          }
          setTotal(result.total);
          setPage(pageNum);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createMember = useCallback(
    async data => {
      try {
        setLoading(true);
        const result = await createExecutiveMember(data);
        if (result.success) {
          await loadMembers(1, 50, '');
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [loadMembers],
  );

  const updateMember = useCallback(
    async (id, data) => {
      try {
        setLoading(true);
        const result = await updateExecutiveMember(id, data);
        if (result.success) {
          await loadMembers(page, 50, '');
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [page, loadMembers],
  );

  const deleteMember = useCallback(
    async id => {
      try {
        setLoading(true);
        const result = await deleteExecutiveMember(id);
        if (result.success) {
          await loadMembers(page, 50, '');
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [page, loadMembers],
  );

  return {
    members,
    loading,
    error,
    page,
    total,
    loadMembers,
    createMember,
    updateMember,
    deleteMember,
  };
};

/**
 * Custom hook for Local Secretaries management
 */
export const useLocalSecretaries = () => {
  const [secretaries, setSecretaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadSecretaries = useCallback(
    async (pageNum = 1, limit = 50, search = '') => {
      try {
        setLoading(true);
        setError(null);
        const result = await getLocalSecretaries(pageNum, limit, search);
        if (result.success) {
          if (pageNum === 1) {
            setSecretaries(result.secretaries);
          } else {
            setSecretaries(prev => [...prev, ...result.secretaries]);
          }
          setTotal(result.total);
          setPage(pageNum);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createSecretary = useCallback(
    async data => {
      try {
        setLoading(true);
        const result = await createLocalSecretary(data);
        if (result.success) {
          await loadSecretaries(1, 50, '');
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [loadSecretaries],
  );

  const updateSecretary = useCallback(
    async (id, data) => {
      try {
        setLoading(true);
        const result = await updateLocalSecretary(id, data);
        if (result.success) {
          await loadSecretaries(page, 50, '');
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [page, loadSecretaries],
  );

  const deleteSecretary = useCallback(
    async id => {
      try {
        setLoading(true);
        const result = await deleteLocalSecretary(id);
        if (result.success) {
          await loadSecretaries(page, 50, '');
          return result;
        }
        setError(result.message);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [page, loadSecretaries],
  );

  return {
    secretaries,
    loading,
    error,
    page,
    total,
    loadSecretaries,
    createSecretary,
    updateSecretary,
    deleteSecretary,
  };
};
