import { Complaint, ApiError, PaginatedResponse, ComplaintStatus } from '../types';
import { MOCK_USER_ID } from '../constants';

export let mockComplaintsDB: Complaint[] = [
    {
        id: 1,
        complainant_id: MOCK_USER_ID,
        complaint_type: 'user_behavior',
        subject_user_id: 2, // Complaining about user Jane D.
        title: "Rude communication from owner",
        details: "The owner was very impolite when I asked a question about the product.",
        status: ComplaintStatus.SUBMITTED,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const getComplaintsForUser = async (userId: number, params: { status?: string, page?:number, limit?:number }): Promise<PaginatedResponse<Complaint>> => {
     return new Promise(resolve => {
        setTimeout(() => {
            const complaints = mockComplaintsDB.filter(c => c.complainant_id === userId)
                .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            // Simplified pagination
            resolve({ data: complaints, meta: { total: complaints.length, current_page: 1, per_page: 10, last_page: 1, from:0,to:0 } });
        }, 500);
    });
};

export const submitComplaint = async (payload: Omit<Complaint, 'id'|'complainant_id'|'status'|'created_at'|'updated_at'|'complaint_uid'|'admin_handler_id'|'resolution_notes'|'closed_at'|'attachments'>, complainantId: number): Promise<Complaint> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newComplaint: Complaint = {
                id: mockComplaintsDB.length + 1,
                ...payload,
                complainant_id: complainantId,
                status: ComplaintStatus.SUBMITTED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            mockComplaintsDB.push(newComplaint);
            resolve(newComplaint);
        }, 600);
    });
};

// Placeholder for getComplaintDetails, updateComplaintStatus (admin)