import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

// GraphQL queries and mutations
const GET_SOURCE_DATA = gql`
  query GetSourceData {
    allT1Entries {
      id
      name
      price
      category
    }
  }
`;

const SEED_SOURCE_DATA = gql`
  mutation SeedSourceData($data: [T1CreateInput!]!) {
    seedT1Data(data: $data) {
      id
      name
      price
      category
    }
  }
`;

const RESET_DATA = gql`
  mutation ResetData {
    resetData
  }
`;

// Default seed data
const defaultSeedData = [
  { name: "Margherita Pizza", price: 9.99, category: "Pizza" },
  { name: "BBQ Chicken Pizza", price: 11.99, category: "Pizza" },
  { name: "Caesar Salad", price: 7.5, category: "Salad" },
  { name: "Greek Salad", price: 8.5, category: "Salad" },
  { name: "Spaghetti Carbonara", price: 10.5, category: "Pasta" },
];

export default function SourceData() {
  const { data, loading, error } = useQuery(GET_SOURCE_DATA);
  const [seedData, setSeedData] = useState(() =>
    JSON.stringify(defaultSeedData, null, 2)
  );

  const [seedMutation, { loading: seedLoading }] = useMutation(
    SEED_SOURCE_DATA,
    {
      refetchQueries: [{ query: GET_SOURCE_DATA }],
    }
  );

  const [resetMutation, { loading: resetLoading }] = useMutation(RESET_DATA, {
    refetchQueries: [{ query: GET_SOURCE_DATA }],
  });

  const handleSeedData = async () => {
    try {
      const parsedData = JSON.parse(seedData);
      await seedMutation({ variables: { data: parsedData } });
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  };

  const handleResetData = async () => {
    if (
      confirm(
        "Are you sure you want to reset all data? This will clear all mappings and data."
      )
    ) {
      await resetMutation();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Loading source data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error loading source data</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const sourceData = data?.allT1Entries || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-3">Source Data (T1 Table)</h2>
        <p className="mb-4 text-muted-foreground">
          This is the source data from the old menu system that needs to be
          mapped to the new system.
        </p>

        {sourceData.length > 0 ? (
          <Table>
            <TableCaption>Menu items in the old system format</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>{item.category}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 bg-muted/50 rounded-lg">
            <p>
              No source data available. Use the form below to seed some data.
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seed Test Data</CardTitle>
          <CardDescription>
            Add sample menu items to work with by seeding the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="seedData">JSON Data</Label>
            <div className="relative">
              <textarea
                id="seedData"
                rows={10}
                className="w-full min-h-[200px] font-mono text-sm p-4 rounded-md border border-input bg-transparent resize-none"
                value={seedData}
                onChange={(e) => setSeedData(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleResetData}
            disabled={resetLoading}
          >
            {resetLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
              </>
            ) : (
              "Reset All Data"
            )}
          </Button>
          <Button onClick={handleSeedData} disabled={seedLoading}>
            {seedLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...
              </>
            ) : (
              "Seed Data"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
