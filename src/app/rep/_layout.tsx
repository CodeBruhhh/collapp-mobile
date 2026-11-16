import { RoleStack } from '@/components/RoleStack';
import { BrandTheme } from '@/context/BrandThemeContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useMyCollege } from '@/features/rep/hooks';
import { parseCollegeTheme } from '@/features/theme/schema';

export default function RepLayout() {
  const { collegeColors } = usePreferences();
  const college = useMyCollege();
  // With "Use college colors" on, every rep screen (header, tabs, buttons)
  // follows the college page theme; screens with their own <BrandTheme> win.
  const brand = collegeColors ? parseCollegeTheme(college.data?.theme) : null;

  return (
    <BrandTheme brand={brand}>
      <RoleStack />
    </BrandTheme>
  );
}
