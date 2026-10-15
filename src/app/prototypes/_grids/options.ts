export type GridStyleId = 'hang' | 'index' | 'field' | 'stagger'

type Ref = { name: string; url: string }

/** The grid styles under trial, each with the Mobbin sections it draws on. */
export const GRID_STYLES: Array<{ id: GridStyleId; name: string; refs: Ref[] }> = [
  {
    id: 'hang',
    name: 'Hanging margin',
    refs: [
      { name: 'Studio Freight', url: 'https://mobbin.com/sites/sections/0083ebce-0d30-4417-88ce-5b947be47c8e' },
      { name: 'Pentagram', url: 'https://mobbin.com/sites/sections/326ff8e0-1f06-4a08-a915-0e53b4967529' },
      { name: 'Büro', url: 'https://mobbin.com/sites/sections/bc636344-6e5b-4b98-9baa-809b622456fb' },
    ],
  },
  {
    id: 'index',
    name: 'Ruled index',
    refs: [
      { name: 'Locomotive', url: 'https://mobbin.com/sites/sections/280c1a2d-41d4-4495-a4bd-816763c93ad3' },
      { name: 'Nite Riot', url: 'https://mobbin.com/sites/sections/1aa05a05-6920-4f35-a581-3dcf42634162' },
      { name: 'A24', url: 'https://mobbin.com/sites/sections/b645a881-adf5-43f3-a86c-758cd54f0b72' },
    ],
  },
  {
    id: 'field',
    name: 'Modular field',
    refs: [
      { name: 'Analogue', url: 'https://mobbin.com/sites/sections/ff0ea534-f51f-4374-9cab-e441b0fee730' },
      { name: 'Studio Freight', url: 'https://mobbin.com/sites/sections/45d8e2ba-244c-4d39-bafb-93e433cb700c' },
      { name: 'Anima', url: 'https://mobbin.com/sites/sections/ce3ace3b-e472-40ea-bbf8-5fb8f9a3ce94' },
    ],
  },
  {
    id: 'stagger',
    name: 'Staggered columns',
    refs: [
      { name: 'Savor', url: 'https://mobbin.com/sites/sections/a7ac257d-f94a-4665-810c-af0a9f6f6e9a' },
      { name: 'Studio Freight', url: 'https://mobbin.com/sites/sections/e17cb69f-b5cd-4aa4-90ca-82838a400641' },
      { name: 'Readymag', url: 'https://mobbin.com/sites/sections/18bf1b78-4281-4c65-b79c-443af2b345ec' },
    ],
  },
]
