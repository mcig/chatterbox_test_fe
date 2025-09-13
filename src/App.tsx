import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SourceData from "@/components/SourceData";
import MappingProposals from "@/components/MappingProposals";
import TransformedData from "@/components/TransformedData";
import CreateMapping from "@/components/CreateMapping";
import { ScrollArea } from "@/components/ui/scroll-area";

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Schema Mapping with Interactive Learning
          </h1>
          <Button variant="outline" onClick={refreshData}>
            Refresh Data
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6 flex-1">
        <Tabs defaultValue="source" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="source">Source Data</TabsTrigger>
            <TabsTrigger value="mapping">Propose Mapping</TabsTrigger>
            <TabsTrigger value="proposals">Mapping Proposals</TabsTrigger>
            <TabsTrigger value="transformed">Transformed Data</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-220px)] rounded-md border">
            <div className="max-w-[1200px] mx-auto">
              <TabsContent value="source" className="p-6">
                <SourceData key={`source-${refreshTrigger}`} />
              </TabsContent>

              <TabsContent value="mapping" className="p-6">
                <CreateMapping onSuccess={refreshData} />
              </TabsContent>

              <TabsContent value="proposals" className="p-6">
                <MappingProposals
                  key={`proposals-${refreshTrigger}`}
                  onUpdate={refreshData}
                />
              </TabsContent>

              <TabsContent value="transformed" className="p-6">
                <TransformedData key={`transformed-${refreshTrigger}`} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </main>

      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        Schema Mapping with Interactive Learning Demo | Based on L&L research
        paper
      </footer>
    </div>
  );
}

export default App;
