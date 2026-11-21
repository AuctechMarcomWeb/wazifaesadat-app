/**
 * Helper functions to check user permissions
 */

export const hasPermission = (permissions, moduleName, action = 'view') => {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0)
    return false;
  const normalizedName = moduleName
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
  const permission = permissions.find(p =>
    p.module.toLowerCase().includes(normalizedName),
  );
  if (!permission) return false;
  const actionMap = {
    view: 'canView',
    create: 'canCreate',
    edit: 'canEdit',
    delete: 'canDelete',
  };
  return permission[actionMap[action] || 'canView'] === true;
};

export const getAccessibleModules = permissions => {
  if (!permissions || !Array.isArray(permissions)) return [];
  return permissions.filter(p => p.canView === true).map(p => p.module);
};

export const getModuleActions = (permissions, moduleName) => {
  const permission = permissions?.find(p => p.module === moduleName);
  return {
    canView: permission?.canView || false,
    canCreate: permission?.canCreate || false,
    canEdit: permission?.canEdit || false,
    canDelete: permission?.canDelete || false,
  };
};
