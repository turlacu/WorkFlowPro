'use client';

import * as React from 'react';
import type { UserRole } from '@prisma/client';
import { AlertTriangle, LockKeyhole, RotateCcw, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import type { PermissionKey } from '@/lib/permissions';

const ROLES: UserRole[] = ['ADMIN', 'PRODUCER', 'CONTRIBUTOR', 'OPERATOR'];

type CatalogItem = {
  key: PermissionKey;
  group: string;
  label: { en: string; ro: string };
  description: { en: string; ro: string };
};

type Policy = {
  revision: number;
  updatedAt: string | null;
  catalog: CatalogItem[];
  grants: Record<UserRole, PermissionKey[]>;
  corePermissions: PermissionKey[];
  protectedPermission: PermissionKey;
  audits: Array<{
    id: string; occurredAt: string; actorName: string; actorEmail: string;
    targetRole: UserRole; permission: PermissionKey; enabled: boolean;
  }>;
};

type Change = { role: UserRole; permission: PermissionKey; enabled: boolean; label: string };

function copyGrants(grants: Policy['grants']): Policy['grants'] {
  return Object.fromEntries(ROLES.map((role) => [role, [...grants[role]]])) as Policy['grants'];
}

const GROUP_LABELS: Record<string, { en: string; ro: string }> = {
  assignments: { en: 'Assignments', ro: 'Sarcini' },
  scheduling: { en: 'Scheduling', ro: 'Programare' },
  users: { en: 'Users', ro: 'Utilizatori' },
  reporting: { en: 'Reporting and data', ro: 'Rapoarte și date' },
  account: { en: 'Account essentials', ro: 'Funcții de bază ale contului' },
  access: { en: 'Access control', ro: 'Control acces' },
};

export function RolePermissionsDashboard() {
  const { currentLang } = useLanguage();
  const { toast } = useToast();
  const [policy, setPolicy] = React.useState<Policy | null>(null);
  const [draft, setDraft] = React.useState<Policy['grants'] | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('ADMIN');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/role-permissions', { cache: 'no-store' });
      if (!response.ok) throw new Error('load');
      const next = await response.json() as Policy;
      setPolicy(next);
      setDraft(copyGrants(next.grants));
    } catch {
      toast({ title: currentLang === 'ro' ? 'Permisiunile nu au putut fi încărcate' : 'Permissions could not be loaded', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentLang, toast]);

  React.useEffect(() => { void load(); }, [load]);

  const changes = React.useMemo<Change[]>(() => {
    if (!policy || !draft) return [];
    return ROLES.flatMap((role) => policy.catalog.flatMap((item) => {
      const before = policy.grants[role].includes(item.key);
      const after = draft[role].includes(item.key);
      return before === after ? [] : [{ role, permission: item.key, enabled: after, label: item.label[currentLang] }];
    }));
  }, [currentLang, draft, policy]);

  const locked = (role: UserRole, permission: PermissionKey) => Boolean(
    policy && (policy.corePermissions.includes(permission) || permission === policy.protectedPermission),
  );
  const lockReason = (permission: PermissionKey) => permission === policy?.protectedPermission
    ? (currentLang === 'ro' ? 'Protejată: disponibilă exclusiv Administratorului.' : 'Protected: available exclusively to Administrator.')
    : (currentLang === 'ro' ? 'Permisiune de bază obligatorie pentru toate rolurile.' : 'Core permission required for every role.');

  const toggle = (role: UserRole, permission: PermissionKey, enabled: boolean) => {
    if (!draft || locked(role, permission)) return;
    setDraft({
      ...draft,
      [role]: enabled
        ? Array.from(new Set([...draft[role], permission]))
        : draft[role].filter((item) => item !== permission),
    });
  };

  const discard = () => policy && setDraft(copyGrants(policy.grants));

  const save = async () => {
    if (!policy || !draft || changes.length === 0) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/role-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: policy.revision, grants: draft }),
      });
      if (response.status === 409) {
        setReviewOpen(false);
        await load();
        toast({
          title: currentLang === 'ro' ? 'Configurația a fost modificată' : 'Configuration changed',
          description: currentLang === 'ro' ? 'Am reîncărcat cea mai nouă versiune. Revedeți modificările.' : 'The newest version was loaded. Please review your changes again.',
          variant: 'destructive',
        });
        return;
      }
      if (!response.ok) throw new Error('save');
      const next = await response.json() as Policy;
      setPolicy(next);
      setDraft(copyGrants(next.grants));
      setReviewOpen(false);
      toast({
        title: currentLang === 'ro' ? 'Permisiuni salvate' : 'Permissions saved',
        description: currentLang === 'ro' ? 'Modificările se aplică la următoarea autentificare.' : 'Changes apply at each user’s next sign-in.',
      });
    } catch {
      toast({ title: currentLang === 'ro' ? 'Permisiunile nu au putut fi salvate' : 'Permissions could not be saved', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-10 text-sm text-muted-foreground">{currentLang === 'ro' ? 'Se încarcă permisiunile…' : 'Loading permissions…'}</p>;
  if (!policy || !draft) return <Button onClick={() => void load()}>{currentLang === 'ro' ? 'Reîncearcă' : 'Try again'}</Button>;

  const renderPermission = (item: CatalogItem, role: UserRole) => {
    const isLocked = locked(role, item.key);
    const checked = draft[role].includes(item.key);
    return (
      <div className="flex items-start gap-3" title={isLocked ? lockReason(item.key) : undefined}>
        <Checkbox
          checked={checked}
          disabled={isLocked}
          onCheckedChange={(value) => toggle(role, item.key, value === true)}
          aria-label={`${item.label[currentLang]} — ${role}`}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            {item.label[currentLang]}
            {isLocked && <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
          </div>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.description[currentLang]}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm leading-6 text-muted-foreground">
            {currentLang === 'ro'
              ? 'Acordă capabilități rolurilor fixe. Permisiunile protejate și cele de bază sunt blocate pentru siguranță.'
              : 'Grant capabilities to the fixed roles. Protected and core permissions are locked for safety.'}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            {currentLang === 'ro' ? 'Sesiunile existente păstrează accesul până la următoarea autentificare.' : 'Existing sessions keep their access until the next sign-in.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={discard} disabled={!changes.length || saving}>
            <RotateCcw className="mr-2 h-4 w-4" />{currentLang === 'ro' ? 'Renunță' : 'Discard'}
          </Button>
          <Button onClick={() => setReviewOpen(true)} disabled={!changes.length || saving}>
            <Save className="mr-2 h-4 w-4" />{currentLang === 'ro' ? `Revizuiește (${changes.length})` : `Review (${changes.length})`}
          </Button>
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-md border md:block">
        <Table>
          <TableHeader><TableRow><TableHead className="sticky left-0 z-10 min-w-72 bg-background">{currentLang === 'ro' ? 'Permisiune' : 'Permission'}</TableHead>{ROLES.map((role) => <TableHead key={role} className="min-w-36 text-center">{role}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{policy.catalog.map((item, index) => (
            <React.Fragment key={item.key}>
              {(index === 0 || policy.catalog[index - 1].group !== item.group) && <TableRow className="bg-muted/60 hover:bg-muted/60"><TableCell colSpan={5} className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{GROUP_LABELS[item.group]?.[currentLang] ?? item.group}</TableCell></TableRow>}
              <TableRow>
                <TableCell className="sticky left-0 bg-background"><p className="font-medium">{item.label[currentLang]}</p><p className="mt-1 max-w-md text-xs text-muted-foreground">{item.description[currentLang]}</p></TableCell>
                {ROLES.map((role) => <TableCell key={role} className="text-center"><Checkbox title={locked(role, item.key) ? lockReason(item.key) : undefined} checked={draft[role].includes(item.key)} disabled={locked(role, item.key)} onCheckedChange={(value) => toggle(role, item.key, value === true)} aria-label={`${item.label[currentLang]} — ${role}${locked(role, item.key) ? ` — ${lockReason(item.key)}` : ''}`} /></TableCell>)}
              </TableRow>
            </React.Fragment>
          ))}</TableBody>
        </Table>
      </div>

      <div className="space-y-5 md:hidden">
        <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
        </Select>
        <div className="rounded-md border px-4">{policy.catalog.map((item, index) => <React.Fragment key={item.key}>{(index === 0 || policy.catalog[index - 1].group !== item.group) && <h3 className="border-b bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground -mx-4">{GROUP_LABELS[item.group]?.[currentLang] ?? item.group}</h3>}<div className="border-b py-4 last:border-b-0">{renderPermission(item, selectedRole)}</div></React.Fragment>)}</div>
      </div>

      <section className="space-y-3 border-t pt-6">
        <div><h3 className="text-lg font-semibold">{currentLang === 'ro' ? 'Modificări recente' : 'Recent changes'}</h3><p className="text-sm text-muted-foreground">{currentLang === 'ro' ? 'Ultimele 100 de modificări individuale.' : 'The latest 100 individual permission changes.'}</p></div>
        <div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>{currentLang === 'ro' ? 'Dată' : 'Date'}</TableHead><TableHead>{currentLang === 'ro' ? 'Administrator' : 'Administrator'}</TableHead><TableHead>{currentLang === 'ro' ? 'Rol' : 'Role'}</TableHead><TableHead>{currentLang === 'ro' ? 'Modificare' : 'Change'}</TableHead></TableRow></TableHeader><TableBody>
          {policy.audits.length ? policy.audits.map((audit) => {
            const item = policy.catalog.find((entry) => entry.key === audit.permission);
            return <TableRow key={audit.id}><TableCell className="whitespace-nowrap text-xs">{new Intl.DateTimeFormat(currentLang === 'ro' ? 'ro-RO' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(audit.occurredAt))}</TableCell><TableCell><p className="text-sm">{audit.actorName}</p><p className="text-xs text-muted-foreground">{audit.actorEmail}</p></TableCell><TableCell>{audit.targetRole}</TableCell><TableCell className={audit.enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}>{audit.enabled ? (currentLang === 'ro' ? 'Acordată' : 'Granted') : (currentLang === 'ro' ? 'Eliminată' : 'Removed')} — {item?.label[currentLang] ?? audit.permission}</TableCell></TableRow>;
          }) : <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{currentLang === 'ro' ? 'Nu există modificări.' : 'No changes yet.'}</TableCell></TableRow>}
        </TableBody></Table></div>
      </section>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{currentLang === 'ro' ? 'Revizuiește modificările' : 'Review changes'}</DialogTitle><DialogDescription>{currentLang === 'ro' ? 'Confirmă exact ce va fi acordat sau eliminat.' : 'Confirm exactly what will be granted or removed.'}</DialogDescription></DialogHeader>
          <div className="divide-y rounded-md border px-4">{changes.map((change) => <div key={`${change.role}:${change.permission}`} className="flex items-start justify-between gap-4 py-3 text-sm"><div><p className="font-medium">{change.label}</p><p className="text-xs text-muted-foreground">{change.role}</p></div><span className={change.enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}>{change.enabled ? (currentLang === 'ro' ? 'Acordă' : 'Grant') : (currentLang === 'ro' ? 'Elimină' : 'Remove')}</span></div>)}</div>
          <DialogFooter><Button variant="outline" onClick={() => setReviewOpen(false)}>{currentLang === 'ro' ? 'Înapoi' : 'Back'}</Button><Button onClick={() => void save()} disabled={saving}>{saving ? (currentLang === 'ro' ? 'Se salvează…' : 'Saving…') : (currentLang === 'ro' ? 'Confirmă și salvează' : 'Confirm and save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
