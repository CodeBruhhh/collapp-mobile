import { APPLICATIONS, COLLEGES } from '@/data/mockData';
import type { ApplicationView } from '@/types/models';

import { delay } from './mockApi';

export function listApplications(): Promise<ApplicationView[]> {
  const views = APPLICATIONS.flatMap((application) => {
    const college = COLLEGES.find((c) => c.id === application.collegeId);
    const program = college?.programs.find((p) => p.id === application.programId);
    return college && program ? [{ ...application, college, program }] : [];
  });
  return delay(views);
}
