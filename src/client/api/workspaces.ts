import { ApiError, apiFetch, postJson } from './http'

/** Phiên/đề tài nghiên cứu: research gắn phiên chỉ dùng PDF của phiên, không tìm nguồn ngoài. */
export interface Workspace {
  id: string
  name: string
  createdAt: string
}

interface ApiWorkspace {
  id: string
  name: string
  created_at: string
}

export class WorkspaceError extends ApiError {}

const mapWorkspace = (w: ApiWorkspace): Workspace => ({ id: w.id, name: w.name, createdAt: w.created_at })

export async function listWorkspaces(): Promise<Workspace[]> {
  return (await apiFetch<ApiWorkspace[]>('/workspaces', {}, WorkspaceError)).map(mapWorkspace)
}

export async function createWorkspace(name: string): Promise<Workspace> {
  return mapWorkspace(await postJson<ApiWorkspace>('/workspaces', { name }, WorkspaceError))
}
