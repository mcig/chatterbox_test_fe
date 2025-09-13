import { useQuery, gql } from "@apollo/client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// GraphQL queries
const GET_MENU_ITEMS = gql`
  query GetMenuItems {
    allMenuItems {
      id
      title
      price
      category {
        id
        title
      }
    }
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    allCategories {
      id
      title
      menuItems {
        id
        title
      }
    }
  }
`;

export default function TransformedData() {
  const {
    data: menuItemsData,
    loading: menuItemsLoading,
    error: menuItemsError,
  } = useQuery(GET_MENU_ITEMS);

  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useQuery(GET_CATEGORIES);

  const loading = menuItemsLoading || categoriesLoading;
  const error = menuItemsError || categoriesError;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Loading transformed data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error loading transformed data</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const menuItems = menuItemsData?.allMenuItems || [];
  const categories = categoriesData?.allCategories || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-3">
          Transformed Data (Target Schema)
        </h2>
        <p className="mb-4 text-muted-foreground">
          This is the result of applying the accepted mapping function to
          transform the source data.
        </p>
      </div>

      <Tabs defaultValue="menuItems">
        <TabsList>
          <TabsTrigger value="menuItems">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="menuItems">
          {menuItems.length > 0 ? (
            <Table>
              <TableCaption>
                Transformed menu items in the new system
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category?.title}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 bg-muted/50 rounded-lg">
              <p>
                No transformed menu items available yet. Create and accept a
                mapping proposal to see results.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          {categories.length > 0 ? (
            <Table>
              <TableCaption>Categories in the new system</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Menu Items Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>{category.title}</TableCell>
                    <TableCell>{category.menuItems?.length || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 bg-muted/50 rounded-lg">
              <p>
                No categories available yet. Create and accept a mapping
                proposal to see results.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
