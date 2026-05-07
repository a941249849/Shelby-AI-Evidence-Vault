export interface ShelbyUploadResult {
  shelbyRef: string;
  hash: string;
  timestamp: string;
}

export interface ShelbyAdapter {
  upload(data: unknown, metadata: Record<string, string>): Promise<ShelbyUploadResult>;
  getBlobRef(id: string): string;
  isConnected(): boolean;
}

export const mockShelbyAdapter: ShelbyAdapter = {
  async upload(_data: unknown, metadata: Record<string, string>): Promise<ShelbyUploadResult> {
    const id = Math.random().toString(36).slice(2, 18);
    const hashHex = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return {
      shelbyRef: `shelby://testnet/blob/${id}`,
      hash: `sha256:${hashHex}`,
      timestamp: new Date().toISOString(),
      ...metadata,
    } as ShelbyUploadResult;
  },

  getBlobRef(id: string): string {
    return `shelby://testnet/blob/${id}`;
  },

  isConnected(): boolean {
    return false;
  },
};
