"use client";

import React, { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import {
  createCurrentTenantUser,
  listCurrentTenantUsers,
  resetCurrentTenantUserPassword,
  updateCurrentTenant,
  updateCurrentTenantUser,
  deleteCurrentTenantUser,
  type AdminTenant,
  type AdminUser,
} from '@/lib/admin';
import { resolveTenantAsset, setTenantPublicCache } from '@/lib/tenant';
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Pencil,
  KeyRound,
  Trash2,
  Power,
  Loader2,
  Mail,
  Lock,
  CheckCircle,
  X,
  Camera,
  Image as ImageIcon,
  UploadCloud,
  LayoutTemplate
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PageTitle from '@/components/page-title';

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const passwordHint =
  'Mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.';

function isStrongPassword(value: string) {
  return strongPasswordRegex.test(value);
}

function getPasswordChecks(value: string) {
  return {
    minLength: value.length >= 8,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  };
}

export default function AdminPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [tenant, setTenant] = useState<AdminTenant | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  
  // Controle de Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createPassword, setCreatePassword] = useState('');
  const [createPasswordFocused, setCreatePasswordFocused] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [isUpdating, setIsUpdating] = useState(false);

  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetPasswordFocused, setResetPasswordFocused] = useState(false);

  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [savingTenant, setSavingTenant] = useState(false);
  
  // Previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const session = await getSession();
        const isSuper = session?.user?.role === 'SUPER_ADMIN';
        if (!mounted) return;
        setIsSuperAdmin(isSuper);
        if (!isSuper) {
          setLoadingData(false);
          return;
        }

        const data = await listCurrentTenantUsers();
        if (!mounted) return;
        setTenant(data.tenant || null);
        setTenantName(data.tenant?.name || '');
        setUsers(data.users || []);
      } catch (error) {
        if (!mounted) return;
        setIsSuperAdmin(false);
        toast.error('Não foi possível carregar os usuários.');
      } finally {
        if (mounted) setLoadingData(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function reloadUsers() {
    const data = await listCurrentTenantUsers();
    setTenant(data.tenant || null);
    setTenantName(data.tenant?.name || '');
    setUsers(data.users || []);
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreatingUser(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      password: createPassword,
      role: String(formData.get('role') || 'USER'),
    };

    if (!isStrongPassword(payload.password)) {
      toast.error('Senha fraca. ' + passwordHint);
      setCreatingUser(false);
      return;
    }

    try {
      await createCurrentTenantUser(payload);
      await reloadUsers();
      toast.success('Usuário criado com sucesso!');
      setIsCreateModalOpen(false);
      setCreatePassword('');
      setCreatePasswordFocused(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário');
    } finally {
      setCreatingUser(false);
    }
  }

  function startEdit(user: AdminUser) {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role || 'USER');
  }

  async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);

    try {
      await updateCurrentTenantUser(editingUser.id, {
        name: editName,
        email: editEmail,
      });
      await reloadUsers();
      toast.success('Usuário atualizado com sucesso!');
      setEditingUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar usuário');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetUser) return;

    if (!resetPassword || !resetPasswordConfirm) {
      toast.warning('Preencha a nova senha e confirme.');
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      toast.error('As senhas não conferem.');
      return;
    }

    if (!isStrongPassword(resetPassword)) {
      toast.error('Senha fraca. ' + passwordHint);
      return;
    }

    try {
      setResetLoading(true);
      await resetCurrentTenantUserPassword(resetUser.id, resetPassword);
      toast.success('Senha redefinida com sucesso!');
      setResetUser(null);
      setResetPassword('');
      setResetPasswordConfirm('');
      setResetPasswordFocused(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao redefinir senha');
    } finally {
      setResetLoading(false);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    try {
      await updateCurrentTenantUser(user.id, { active: !user.active });
      await reloadUsers();
      toast.success(`Usuário ${!user.active ? 'ativado' : 'desativado'} com sucesso.`);
    } catch (error) {
      toast.error('Erro ao alterar status do usuário');
    }
  }

  async function handleDeleteUser() {
    if (!deleteUser) return;
    try {
      await deleteCurrentTenantUser(deleteUser.id);
      setDeleteUser(null);
      await reloadUsers();
      toast.success('Usuário excluído permanentemente.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir usuário');
    }
  }

  async function handleUpdateTenant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    try {
      setSavingTenant(true);
      const form = e.currentTarget;
      const formData = new FormData(form);
      formData.set('name', tenantName);
      const updated = await updateCurrentTenant(formData);
      setTenant(updated);
      setTenantName(updated.name || tenantName);
      setTenantPublicCache({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        active: updated.active,
        logoUrl: updated.logoUrl ?? null,
        loginBannerUrl: updated.loginBannerUrl ?? null,
        faviconUrl: updated.faviconUrl ?? null,
        defaultAvatarUrl: updated.defaultAvatarUrl ?? null,
        themeColor: updated.themeColor ?? null,
      });
      setLogoPreview(null);
      setAvatarPreview(null);
      setBannerPreview(null);
      toast.success('Instância atualizada com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar instância');
    } finally {
      setSavingTenant(false);
    }
  }

  function handlePreviewChange(
    setter: React.Dispatch<React.SetStateAction<string | null>>,
  ) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setter(URL.createObjectURL(file));
      }
    };
  }

  const logoSrc = logoPreview || resolveTenantAsset(tenant?.logoUrl) || '/logo.png';
  const avatarSrc = avatarPreview || resolveTenantAsset(tenant?.defaultAvatarUrl) || '/globo.png';
  const bannerSrc = bannerPreview || resolveTenantAsset(tenant?.loginBannerUrl) || '/banner-login.jpg';
  const createPasswordChecks = getPasswordChecks(createPassword);
  const resetPasswordChecks = getPasswordChecks(resetPassword);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const adminUsers = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
           <Skeleton className="h-10 w-64 rounded-xl" />
           <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm mt-8">
        <ShieldAlert className="w-16 h-16 mx-auto text-rose-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2">
          Apenas super administradores podem acessar esta área.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageTitle
            title="Administração"
            className="text-2xl lg:text-3xl font-bold text-slate-800"
          />
          {tenant?.name && (
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              Gerenciando instância <strong className="text-slate-700">{tenant.name}</strong>
            </p>
          )}
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white h-12 px-6 rounded-xl shadow-lg shadow-indigo-200 w-full sm:w-auto"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Tenant Branding Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Identidade Visual & Configuração</h3>
        </div>
        
        <form onSubmit={handleUpdateTenant}>
          {/* Banner Area */}
          <div className="relative group w-full h-48 sm:h-64 bg-slate-100 overflow-hidden">
            {bannerSrc ? (
              <img src={bannerSrc} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <ImageIcon className="w-12 h-12 opacity-50" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label htmlFor="banner-upload" className="cursor-pointer bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/50 px-4 py-2 rounded-xl flex items-center gap-2 transition-all">
                <Camera className="w-5 h-5" />
                Alterar Banner de Login
              </label>
              <input 
                id="banner-upload" 
                name="banner" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePreviewChange(setBannerPreview)} 
              />
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Logo e Avatar Column */}
              <div className="flex flex-col gap-4 -mt-12 md:-mt-16 z-10 w-full md:w-auto shrink-0">
                {/* Logo */}
                <div className="relative group w-32 h-32 mx-auto md:mx-0">
                  <div className="w-full h-full rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                    <img src={logoSrc} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <label htmlFor="logo-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                    <Camera className="w-8 h-8" />
                  </label>
                  <input 
                    id="logo-upload" 
                    name="logo" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePreviewChange(setLogoPreview)} 
                  />
                  <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-1.5 rounded-full border-2 border-white" title="Logo da Escola">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                {/* Avatar Upload Box */}
                <div className="mt-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block text-center md:text-left">Avatar Padrão</Label>
                  <div className="relative group h-20 w-full md:w-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer overflow-hidden">
                     <img src={avatarSrc} alt="Avatar" className="max-h-14 max-w-[90%] object-contain p-1" />
                     <label htmlFor="avatar-upload" className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-indigo-600 text-xs font-medium">
                        <UploadCloud className="w-6 h-6 mb-1" />
                        Alterar Avatar
                     </label>
                     <input 
                      id="avatar-upload" 
                      name="avatar" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePreviewChange(setAvatarPreview)} 
                    />
                  </div>
                </div>
              </div>

              {/* Fields Column */}
              <div className="flex-1 pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 font-medium mb-1.5 block">Nome da Instância</Label>
                    <Input
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="!h-12 rounded-xl border-slate-200 focus:border-indigo-500"
                      placeholder="Ex: Minha Escola"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700 font-medium mb-1.5 block">Identificador (Slug)</Label>
                    <Input
                      value={tenant?.slug || ''}
                      disabled
                      className="!h-12 rounded-xl bg-slate-50 text-slate-500 border-slate-200"
                    />
                    <p className="text-xs text-slate-400 mt-1">O slug é usado na URL e não pode ser alterado.</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                   <Button
                    type="submit"
                    className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all"
                    disabled={savingTenant}
                  >
                    {savingTenant ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {savingTenant ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{totalUsers}</p>
            <p className="text-sm text-slate-500">Total de Usuários</p>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 sm:p-6 border border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Power className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{activeUsers}</p>
            <p className="text-sm text-emerald-600">Contas Ativas</p>
          </div>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-4 sm:p-6 border border-indigo-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">{adminUsers}</p>
            <p className="text-sm text-indigo-600">Administradores</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Gerenciar Usuários</h3>
          <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
             Mostrando {users.length} registros
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Nenhum usuário cadastrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-gradient-from-light)] to-[var(--brand-gradient-to-light)] flex items-center justify-center text-white font-bold shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{user.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                  <div className="flex gap-2">
                    <Badge className={cn("font-medium border shadow-sm", 
                      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                        : 'bg-slate-50 text-slate-700 border-slate-100'
                    )}>
                      {user.role}
                    </Badge>
                    
                    <Badge className={cn("font-medium border shadow-sm",
                      user.active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    )}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-all border",
                        user.active 
                          ? "border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" 
                          : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      )}
                      title={user.active ? "Desativar" : "Ativar"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => startEdit(user)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                      title="Editar Usuário"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setResetUser(user)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 transition-all"
                      title="Redefinir Senha"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteUser(user)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all"
                      title="Excluir Permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais permanecem iguais... */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreatePassword('');
            setCreatePasswordFocused(false);
          }
          setIsCreateModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              Novo Usuário
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4 pt-4" onSubmit={handleCreateUser} noValidate>
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">Nome Completo</Label>
              <Input name="name" placeholder="Ex: João da Silva" className="!h-12 rounded-xl" required />
            </div>
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">E-mail</Label>
              <Input name="email" type="email" placeholder="joao@escola.com" className="!h-12 rounded-xl" required />
            </div>
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">Senha Inicial</Label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                className="!h-12 rounded-xl"
                autoComplete="new-password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                onFocus={() => setCreatePasswordFocused(true)}
                onBlur={() => setCreatePasswordFocused(false)}
                required
              />
              {createPasswordFocused && (
                <div className="text-xs mt-2 space-y-1">
                  <p className={`flex items-center gap-2 ${createPasswordChecks.minLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {createPasswordChecks.minLength ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    8 caracteres
                  </p>
                  <p className={`flex items-center gap-2 ${createPasswordChecks.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {createPasswordChecks.upper ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    letra maiúscula
                  </p>
                  <p className={`flex items-center gap-2 ${createPasswordChecks.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {createPasswordChecks.lower ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    letra minúscula
                  </p>
                  <p className={`flex items-center gap-2 ${createPasswordChecks.number ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {createPasswordChecks.number ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    número
                  </p>
                  <p className={`flex items-center gap-2 ${createPasswordChecks.symbol ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {createPasswordChecks.symbol ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    símbolo
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">Permissão (Role)</Label>
              <Select defaultValue="USER" name="role">
                <SelectTrigger className="!h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuário (USER)</SelectItem>
                  <SelectItem value="ADMIN">Administrador (ADMIN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white" disabled={creatingUser}>
                {creatingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {creatingUser ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Pencil className="w-5 h-5 text-indigo-500" />
              Editar Usuário
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4 pt-4" onSubmit={handleUpdateUser}>
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">Nome Completo</Label>
              <Input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="!h-12 rounded-xl" 
                required 
              />
            </div>
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">E-mail</Label>
              <Input 
                type="email" 
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="!h-12 rounded-xl" 
                required 
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(resetUser)}
        onOpenChange={(open) => {
          if (!open) {
            setResetUser(null);
            setResetPassword('');
            setResetPasswordConfirm('');
            setResetPasswordFocused(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Lock className="w-5 h-5 text-amber-500" />
              Redefinir Senha
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4 pt-4" onSubmit={handleResetPassword} noValidate>
            <div className="p-3 bg-amber-50 text-amber-800 text-sm rounded-xl mb-4">
              Você está redefinindo a senha de <strong>{resetUser?.name}</strong>.
            </div>
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">Nova Senha</Label>
              <Input
                type="password"
                placeholder="Digite a nova senha"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="!h-12 rounded-xl"
                autoComplete="new-password"
                onFocus={() => setResetPasswordFocused(true)}
                onBlur={() => setResetPasswordFocused(false)}
                required
              />
              {resetPasswordFocused && (
                <div className="text-xs mt-2 space-y-1">
                  <p className={`flex items-center gap-2 ${resetPasswordChecks.minLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {resetPasswordChecks.minLength ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    8 caracteres
                  </p>
                  <p className={`flex items-center gap-2 ${resetPasswordChecks.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {resetPasswordChecks.upper ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    letra maiúscula
                  </p>
                  <p className={`flex items-center gap-2 ${resetPasswordChecks.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {resetPasswordChecks.lower ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    letra minúscula
                  </p>
                  <p className={`flex items-center gap-2 ${resetPasswordChecks.number ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {resetPasswordChecks.number ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    número
                  </p>
                  <p className={`flex items-center gap-2 ${resetPasswordChecks.symbol ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {resetPasswordChecks.symbol ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    símbolo
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">Confirmar Senha</Label>
              <Input
                type="password"
                placeholder="Confirme a nova senha"
                value={resetPasswordConfirm}
                onChange={(e) => setResetPasswordConfirm(e.target.value)}
                className="!h-12 rounded-xl"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setResetUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white" disabled={resetLoading}>
                {resetLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Redefinir
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteUser)} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Excluir Usuário
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-base mt-2">
              Tem certeza que deseja excluir o usuário <strong className="text-slate-800">{deleteUser?.name}</strong>? 
              Esta ação é permanente e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11 rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white" 
              onClick={handleDeleteUser}
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
