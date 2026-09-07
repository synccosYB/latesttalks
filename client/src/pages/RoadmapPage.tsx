import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { StatsBar } from "@/components/StatsBar";
import { TimelineView } from "@/components/TimelineView";
import { ListView } from "@/components/ListView";
import { InitiativeModal } from "@/components/InitiativeModal";
import { InitiativeDetailModal } from "@/components/InitiativeDetailModal";
import { Initiative, Team, Priority, Quarter, QUARTERS } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality - replace with API calls
const MOCK_INITIATIVES: Initiative[] = [
  {
    id: "1",
    title: "Implement user authentication",
    description: "Build OAuth2 integration with Google and GitHub providers for seamless user login",
    team: "engineering",
    priority: "high",
    quarter: "Q1",
  },
  {
    id: "2",
    title: "Redesign dashboard UI",
    description: "Create modern, intuitive dashboard with improved data visualization",
    team: "design",
    priority: "medium",
    quarter: "Q1",
  },
  {
    id: "3",
    title: "Launch email campaign",
    description: "Q2 product launch marketing push with segmented audience targeting",
    team: "marketing",
    priority: "high",
    quarter: "Q2",
  },
  {
    id: "4",
    title: "API rate limiting",
    description: "Implement rate limiting to protect backend services from abuse",
    team: "engineering",
    priority: "medium",
    quarter: "Q2",
  },
  {
    id: "5",
    title: "Mobile app beta",
    description: "Release beta version to early adopters for feedback collection",
    team: "product",
    priority: "high",
    quarter: "Q3",
  },
  {
    id: "6",
    title: "Design system v2",
    description: "Update component library with new brand guidelines and tokens",
    team: "design",
    priority: "low",
    quarter: "Q3",
  },
  {
    id: "7",
    title: "Sales training program",
    description: "Train sales team on new product features and value propositions",
    team: "sales",
    priority: "medium",
    quarter: "Q4",
  },
  {
    id: "8",
    title: "Annual customer survey",
    description: "Gather customer feedback for next year's product planning",
    team: "product",
    priority: "low",
    quarter: "Q4",
  },
];

export default function RoadmapPage() {
  const { toast } = useToast();
  const [year, setYear] = useState(2024);
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  
  // todo: remove mock functionality
  const [initiatives, setInitiatives] = useState<Initiative[]>(MOCK_INITIATIVES);
  
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([
    "engineering", "design", "marketing", "product", "sales"
  ]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([
    "high", "medium", "low"
  ]);
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createQuarter, setCreateQuarter] = useState<Quarter>("Q1");
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [viewingInitiative, setViewingInitiative] = useState<Initiative | null>(null);

  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(
      i => selectedTeams.includes(i.team) && selectedPriorities.includes(i.priority)
    );
  }, [initiatives, selectedTeams, selectedPriorities]);

  const handleTeamToggle = (team: Team) => {
    setSelectedTeams(prev => 
      prev.includes(team) 
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  const handlePriorityToggle = (priority: Priority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const handleClearFilters = () => {
    setSelectedTeams(["engineering", "design", "marketing", "product", "sales"]);
    setSelectedPriorities(["high", "medium", "low"]);
  };

  const handleAddClick = (quarter?: Quarter) => {
    setCreateQuarter(quarter || "Q1");
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = (data: { title: string; description?: string; team: Team; priority: Priority; quarter: Quarter }) => {
    // todo: remove mock functionality
    const newInitiative: Initiative = {
      ...data,
      description: data.description || "",
      id: `initiative-${Date.now()}`,
    };
    setInitiatives(prev => [...prev, newInitiative]);
    toast({
      title: "Initiative created",
      description: `"${data.title}" has been added to ${data.quarter}.`,
    });
  };

  const handleEditSubmit = (data: { title: string; description?: string; team: Team; priority: Priority; quarter: Quarter }) => {
    if (!editingInitiative) return;
    
    // todo: remove mock functionality
    setInitiatives(prev => 
      prev.map(i => i.id === editingInitiative.id ? { ...data, description: data.description || "", id: i.id } : i)
    );
    setEditingInitiative(null);
    toast({
      title: "Initiative updated",
      description: `"${data.title}" has been updated.`,
    });
  };

  const handleDelete = (id: string) => {
    // todo: remove mock functionality
    const initiative = initiatives.find(i => i.id === id);
    setInitiatives(prev => prev.filter(i => i.id !== id));
    toast({
      title: "Initiative deleted",
      description: initiative ? `"${initiative.title}" has been removed.` : "Initiative removed.",
    });
  };

  const handleMoveInitiative = (initiativeId: string, newQuarter: Quarter) => {
    // todo: remove mock functionality
    setInitiatives(prev =>
      prev.map(i => i.id === initiativeId ? { ...i, quarter: newQuarter } : i)
    );
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (initiative) {
      toast({
        title: "Initiative moved",
        description: `"${initiative.title}" moved to ${newQuarter}.`,
      });
    }
  };

  const handleInitiativeClick = (initiative: Initiative) => {
    setViewingInitiative(initiative);
  };

  const handleEditFromDetail = (initiative: Initiative) => {
    setViewingInitiative(null);
    setEditingInitiative(initiative);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        year={year}
        onYearChange={setYear}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddInitiative={() => handleAddClick()}
      />
      
      <FilterBar
        selectedTeams={selectedTeams}
        selectedPriorities={selectedPriorities}
        onTeamToggle={handleTeamToggle}
        onPriorityToggle={handlePriorityToggle}
        onClearFilters={handleClearFilters}
      />
      
      <StatsBar initiatives={filteredInitiatives} />
      
      <main className="flex-1">
        {viewMode === "timeline" ? (
          <TimelineView
            initiatives={filteredInitiatives}
            year={year}
            onInitiativeClick={handleInitiativeClick}
            onAddClick={handleAddClick}
            onMoveInitiative={handleMoveInitiative}
          />
        ) : (
          <div className="p-4 md:p-6">
            <ListView
              initiatives={filteredInitiatives}
              onInitiativeClick={handleInitiativeClick}
            />
          </div>
        )}
      </main>

      <InitiativeModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        defaultQuarter={createQuarter}
      />

      <InitiativeModal
        open={!!editingInitiative}
        onClose={() => setEditingInitiative(null)}
        onSubmit={handleEditSubmit}
        initiative={editingInitiative}
      />

      <InitiativeDetailModal
        open={!!viewingInitiative}
        initiative={viewingInitiative}
        onClose={() => setViewingInitiative(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDelete}
      />
    </div>
  );
}
