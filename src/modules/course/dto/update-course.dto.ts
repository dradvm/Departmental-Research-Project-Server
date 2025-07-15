export class UpdateCourseDto {
  title: string;
  subTitle: string;
  description: string;
  requirement: string;
  price: number;
  isPublic: boolean;
  sections: {
    sectionId?: number;
    nameSection: string;
    order: number;
    lectures: {
      lectureId?: number;
      nameLecture: string;
      video?: string;
      order: number;
      time?: string;
    }[];
  }[];
}
