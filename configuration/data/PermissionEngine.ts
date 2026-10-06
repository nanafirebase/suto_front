export class PermissionEngine {
    private permissions = new Set<string>();

    constructor(apiResponse: any) {
        this.permissions = this.normalize(apiResponse)
    }

    private normalize(api: any): Set<string> {
        const set = new Set<string>();
        Object.entries(api).forEach(([module, perms]: any) => {
            const m = module.toLowerCase();
            // if (perms.assignAllPrivileges === 'yes') {
            //     set.add(`${m}.*`);
            // }
            Object.entries(perms).forEach(([key, rawValue]:any) => {
                const value = rawValue?.value ?? rawValue;
                if (value !== 'yes') return;
                if (key.startsWith('add_update_')) {
                    const r = key.replace('add_update_', '');
                    set.add(`${m}.${r}.create_update`);
                }
                if (key.startsWith('view_')) {
                    const r = key.replace('view_', '');
                    set.add(`${m}.${r}.view`);
                }
                if (key.startsWith('delete_')) {
                    const r = key.replace('delete_', '');
                    set.add(`${m}.${r}.delete`);
                }
                if (key.startsWith('confirm_')) {
                    const r = key.replace('confirm_', '');
                    set.add(`${m}.${r}.confirm`);
                }
                if (key.startsWith('new_')) {
                    const r = key.replace('new_', '');
                    set.add(`${m}.${r}.new`);
                }
            })
        })
        return set;
    }

    can(permission: string): boolean {
        if (this.permissions.has(permission)) return true
        const parts = permission.split('.')
        if (parts.length !== 3) return false
        const [module, resource, action] = parts
        if (this.permissions.has(`${module}.${resource}.*`)) return true
        const hasModuleWildcard = this.permissions.has(`${module}.*`)
        if (hasModuleWildcard) {
            const hasAnyResource = Array.from(this.permissions).some(p => p.startsWith(`${module}.`) && p !== `${module}.*`)
            return hasAnyResource
        }
        return false
    }
}