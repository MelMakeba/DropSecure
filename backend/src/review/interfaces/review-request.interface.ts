export interface ReviewRequestBody {
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequestBody {
  rating: number;
  comment?: string;
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    // add other user properties if needed
  };
}
