import { ToggleRow } from '@/components/ToggleRow';
import { usePreferences } from '@/context/PreferencesContext';
import { useMyCollege } from '@/features/rep/hooks';
import { parseCollegeTheme } from '@/features/theme/schema';

/**
 * Representatives: use the college page colours (from the logo or set by
 * hand) for the whole app on this phone, not only on the college page.
 */
export function CollegeColorsToggle() {
  const { collegeColors, setCollegeColors } = usePreferences();
  const college = useMyCollege();
  const hasTheme = Boolean(parseCollegeTheme(college.data?.theme));

  return (
    <ToggleRow
      label="Use college colors in the app"
      description={
        hasTheme
          ? 'Headers, tabs and buttons use your page theme on this phone'
          : 'Set your page colors under Institution → Page theme first'
      }
      value={hasTheme && collegeColors}
      disabled={!hasTheme}
      onChange={setCollegeColors}
    />
  );
}
