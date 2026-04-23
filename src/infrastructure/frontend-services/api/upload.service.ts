export interface PresignImageResponse {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  key: string;
  publicUrl: string;
  expiresInSeconds: number;
}

export const uploadService = {
  async presignImage(input: {
    contentType: string;
    contentLength: number;
  }): Promise<PresignImageResponse> {
    const res = await fetch('/api/uploads/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error((error as string | null) ?? 'Falha ao preparar upload.');
    }
    return res.json() as Promise<PresignImageResponse>;
  },

  async putToPresignedUrl(data: PresignImageResponse, file: Blob): Promise<void> {
    const res = await fetch(data.uploadUrl, {
      method: data.method,
      mode: 'cors',
      credentials: 'omit',
      headers: data.headers,
      body: file,
    });
    if (!res.ok) {
      throw new Error('Falha ao enviar arquivo para o storage.');
    }
  },
};
