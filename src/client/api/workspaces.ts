import { ApiError, apiFetch, postJson } from './http'

/** Phiên/đề tài nghiên cứu: research gắn phiên chỉ dùng PDF của phiên, không tìm nguồn ngoài. */
/** Chế độ nghiên cứu của kho: mỗi chế độ dùng bộ prompt/kiểm tra riêng, không lẫn nhau. */
export type WorkspaceDomain = 'general' | 'mri_brain' | 'deepfake'

export const DOMAIN_OPTIONS: { value: WorkspaceDomain; label: string }[] = [
  { value: 'mri_brain', label: 'MRI não' },
  { value: 'deepfake', label: 'Deepfake' },
  { value: 'general', label: 'Chung (không chuyên biệt)' },
]

export const domainLabel = (d: WorkspaceDomain): string => DOMAIN_OPTIONS.find((o) => o.value === d)?.label ?? d

export interface Workspace {
  id: string
  name: string
  domain: WorkspaceDomain
  createdAt: string
}

interface ApiWorkspace {
  id: string
  name: string
  domain?: WorkspaceDomain
  created_at: string
}

export class WorkspaceError extends ApiError {}

const mapWorkspace = (w: ApiWorkspace): Workspace => ({
  id: w.id,
  name: w.name,
  domain: w.domain ?? 'general',
  createdAt: w.created_at,
})

export async function listWorkspaces(): Promise<Workspace[]> {
  return (await apiFetch<ApiWorkspace[]>('/workspaces', {}, WorkspaceError)).map(mapWorkspace)
}

export async function createWorkspace(name: string, domain: WorkspaceDomain): Promise<Workspace> {
  return mapWorkspace(await postJson<ApiWorkspace>('/workspaces', { name, domain }, WorkspaceError))
}

/** Đổi loại kho; áp cho lượt nghiên cứu bắt đầu sau khi đổi. */
export async function updateWorkspaceDomain(id: string, domain: WorkspaceDomain): Promise<Workspace> {
  return mapWorkspace(
    await apiFetch<ApiWorkspace>(
      `/workspaces/${encodeURIComponent(id)}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain }) },
      WorkspaceError,
    ),
  )
}
