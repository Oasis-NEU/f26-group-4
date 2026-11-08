import { useEffect, useState } from 'react';

import { getPlaceTypes, getSuitedForTags } from '@/services/places';

type FilterOptions = { placeTypes: string[]; suitedFor: string[] };

// Every place type and suited-for tag, for the filter pills on Feed, Map and
// Explore. They only change with a migration, so each screen loads them once.
// TODO (data-layer Phase 1): becomes a useQuery with a long staleTime.
export function useFilterOptions(): FilterOptions {
  const [options, setOptions] = useState<FilterOptions>({ placeTypes: [], suitedFor: [] });

  useEffect(() => {
    let ignore = false;
    Promise.all([getPlaceTypes(), getSuitedForTags()])
      .then(([placeTypes, suitedFor]) => {
        if (!ignore) setOptions({ placeTypes, suitedFor });
      })
      // Without the lists the filter pills are just empty; the page still works.
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  return options;
}
