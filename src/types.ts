export interface Risk {
  id?: string;
  title: string;
  description: string;
  inherentImpact: number;
  inherentLikelihood: number;
  residualImpact: number;
  residualLikelihood: number;
  status: 'Identified' | 'Mitigating' | 'Remediated' | 'Accepted';
  ownerId: string;
  createdAt: string;
}

export interface VendorAudit {
  id?: string;
  vendorName: string;
  contractSummary: string;
  riskScore: number;
  analysis: string;
  findings: string[];
  status: 'Pending' | 'In Review' | 'Approved' | 'Flagged';
  userId: string;
  createdAt: string;
}

export interface ControlAction {
  id?: string;
  controlId: string;
  action: string;
  status: string;
  userId: string;
  timestamp: string;
  signature?: string;
}

export interface Evidence {
  id?: string;
  type: 'POLICY' | 'AUDIT' | 'CONTROL_VERIFICATION' | 'CERTIFICATION';
  title: string;
  description: string;
  hash: string;
  signature: string;
  verifier: string;
  timestamp: string;
  userId: string;
  metadata: any;
}
