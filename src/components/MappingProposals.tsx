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
import { Loader2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// GraphQL queries and mutations
const GET_MAPPINGS = gql`
  query GetMappings {
    allMappings {
      id
      description
      functionCode
      status
      createdAt
    }
  }
`;

const EVALUATE_MAPPING = gql`
  mutation EvaluateMapping($data: MappingStatusInput!) {
    evaluateMapping(data: $data) {
      id
      status
    }
  }
`;

// Helper function to format date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

// Helper function to get status badge
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "accepted":
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accepted
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3.5 w-3.5 mr-1" /> Rejected
        </Badge>
      );
    case "pending":
    default:
      return (
        <Badge variant="outline">
          <HelpCircle className="h-3.5 w-3.5 mr-1" /> Pending
        </Badge>
      );
  }
}

export default function MappingProposals({
  onUpdate,
}: {
  onUpdate: () => void;
}) {
  const { data, loading, error } = useQuery(GET_MAPPINGS);

  const [evaluateMapping, { loading: evaluateLoading }] = useMutation(
    EVALUATE_MAPPING,
    {
      refetchQueries: [{ query: GET_MAPPINGS }],
      onCompleted: () => {
        onUpdate();
      },
    }
  );

  const handleEvaluate = async (id: number, status: string) => {
    try {
      await evaluateMapping({
        variables: {
          data: { id, status },
        },
      });
    } catch (error) {
      console.error("Error evaluating mapping:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Loading mapping proposals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error loading mapping proposals</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const mappings = data?.allMappings || [];
  const pendingMappings = mappings.filter((m: any) => m.status === "pending");
  const evaluatedMappings = mappings.filter((m: any) => m.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-3">Mapping Proposals</h2>
        <p className="mb-4 text-muted-foreground">
          Review, accept, or reject proposed mappings from the source schema to
          the target schema.
        </p>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending ({pendingMappings.length})
            </TabsTrigger>
            <TabsTrigger value="evaluated">
              Evaluated ({evaluatedMappings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingMappings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMappings.map((mapping: any) => (
                    <TableRow key={mapping.id}>
                      <TableCell>{mapping.id}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {mapping.description}
                      </TableCell>
                      <TableCell>{formatDate(mapping.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(mapping.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() =>
                              handleEvaluate(mapping.id, "accepted")
                            }
                            disabled={evaluateLoading}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleEvaluate(mapping.id, "rejected")
                            }
                            disabled={evaluateLoading}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 bg-muted/50 rounded-lg">
                <p>No pending mapping proposals.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="evaluated">
            {evaluatedMappings.length > 0 ? (
              <Table>
                <TableCaption>
                  History of evaluated mapping proposals
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Function Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluatedMappings.map((mapping: any) => (
                    <TableRow key={mapping.id}>
                      <TableCell>{mapping.id}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {mapping.description}
                      </TableCell>
                      <TableCell>{formatDate(mapping.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(mapping.status)}</TableCell>
                      <TableCell className="max-w-md">
                        <ScrollArea className="h-24 rounded-md border p-2">
                          <pre className="text-xs whitespace-pre-wrap">
                            {mapping.functionCode}
                          </pre>
                        </ScrollArea>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 bg-muted/50 rounded-lg">
                <p>No evaluated mapping proposals yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
