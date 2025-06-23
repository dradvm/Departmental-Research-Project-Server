type Rating = {
  percent: number;
  review: number;
};

export type ReviewOverview = {
  ratings: Rating[];
  average: number;
  total: number;
};
