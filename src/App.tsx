import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Filter, ChevronDown, FileText, FileDown, Search, Edit, ZoomIn, ZoomOut, Maximize2, X, LogOut, LogIn } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { exportToWord } from './utils/exportWord';
import { 
  auth, db, loginWithGoogle, logout, onAuthStateChanged, 
  doc, setDoc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, 
  handleFirestoreError, OperationType, User, getDocs, writeBatch
} from './firebase';

interface Person {
  id: string;
  name: string;
  cccd: string;
  certificate: string;
}

const INITIAL_PEOPLE: Person[] = [
  {
    id: '1',
    name: 'Đặng Thị Cẩm Hồng',
    cccd: '089195020158',
    certificate: 'HCM.NT01.01.0415 ngày 02/02/2026 do Trường Đại học Tài Chính - Marketing cấp tại TP.HCM',
  },
  {
    id: '2',
    name: 'Phạm Nguyễn Hoàng Thông',
    cccd: '079084027523',
    certificate: 'HCM.NT01.01.0415 ngày 02/02/2026 do Trường Đại học Tài Chính - Marketing cấp tại TP.HCM',
  },
  {
    id: '3',
    name: 'Nguyễn Văn A',
    cccd: '012345678901',
    certificate: 'Chứng chỉ đấu thầu số 123/2024 do Bộ Kế hoạch và Đầu tư cấp',
  },
  {
    id: '4',
    name: 'Trần Thị B',
    cccd: '012345678902',
    certificate: 'Chứng chỉ đấu thầu số 456/2024 do Bộ Kế hoạch và Đầu tư cấp',
  },
  {
    id: '5',
    name: 'Lê Văn C',
    cccd: '012345678903',
    certificate: 'Chứng chỉ đấu thầu số 789/2024 do Bộ Kế hoạch và Đầu tư cấp',
  },
  {
    id: '6',
    name: 'Phạm Văn D',
    cccd: '012345678904',
    certificate: 'Chứng chỉ đấu thầu số 101/2024 do Bộ Kế hoạch và Đầu tư cấp',
  },
  {
    id: '7',
    name: 'Hoàng Thị E',
    cccd: '012345678905',
    certificate: 'Chứng chỉ đấu thầu số 202/2024 do Bộ Kế hoạch và Đầu tư cấp',
  },
  {
    id: '8',
    name: 'Vũ Văn F',
    cccd: '012345678906',
    certificate: 'Chứng chỉ đấu thầu số 303/2024 do Bộ Kế hoạch và Đầu tư cấp',
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const [people, setPeople] = useState<Person[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [packageName, setPackageName] = useState('');
  const [decision, setDecision] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [selectedFilterNames, setSelectedFilterNames] = useState<string[]>([]);
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Auth Listener
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) setAuthTimeout(true);
    }, 10000); // 10s timeout

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      clearTimeout(timeout);
      if (!currentUser) {
        setPeople([]);
        setSelectedIds(new Set());
        setPackageName('');
        setDecision('');
        setDay('');
        setMonth('');
        setYear('');
        setDataLoading(false);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Data Sync - Experts
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'experts'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expertsData: Person[] = [];
      snapshot.forEach((doc) => {
        expertsData.push({ id: doc.id, ...doc.data() } as Person);
      });
      setPeople(expertsData);
      setDataLoading(false);
      setError(null);
    }, (err) => {
      console.error('Experts sync error:', err);
      setError('Không thể tải danh sách chuyên gia. Vui lòng kiểm tra kết nối mạng hoặc quyền truy cập.');
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Data Sync - Form State
  useEffect(() => {
    if (!user) return;

    const formDocRef = doc(db, 'forms', user.uid);
    const unsubscribe = onSnapshot(formDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPackageName(data.packageName || '');
        setDecision(data.decision || '');
        setDay(data.day || '');
        setMonth(data.month || '');
        setYear(data.year || '');
        setSelectedIds(new Set(data.selectedExpertIds || []));
      }
      setError(null);
    }, (err) => {
      console.error('Form sync error:', err);
      setError('Không thể tải thông tin gói thầu.');
    });

    return () => unsubscribe();
  }, [user]);

  // Debounced Form Save
  useEffect(() => {
    if (!user || dataLoading) return;

    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'forms', user.uid), {
          uid: user.uid,
          packageName,
          decision,
          day,
          month,
          year,
          selectedExpertIds: Array.from(selectedIds),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error('Error saving form state:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, packageName, decision, day, month, year, selectedIds, dataLoading]);

  const seedInitialData = async () => {
    if (!user || isSeeding) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      INITIAL_PEOPLE.forEach(person => {
        const docRef = doc(collection(db, 'experts'));
        batch.set(docRef, {
          name: person.name,
          cccd: person.cccd,
          certificate: person.certificate,
          ownerId: user.uid,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
      setError(null);
    } catch (err) {
      console.error('Error seeding data:', err);
      setError('Không thể khởi tạo dữ liệu mẫu.');
    } finally {
      setIsSeeding(false);
    }
  };

  const resetData = async () => {
    if (!user) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu đã nhập và quay về mặc định?')) {
      try {
        const batch = writeBatch(db);
        
        // Delete form doc
        batch.delete(doc(db, 'forms', user.uid));
        
        // Delete all experts for this user
        const expertsQuery = query(collection(db, 'experts'), where('ownerId', '==', user.uid));
        const expertsSnapshot = await getDocs(expertsQuery);
        expertsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        window.location.reload();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'resetData');
      }
    }
  };

  const toggleSelectAll = () => {
    if (filteredPeople.length === 0) return;
    const allFilteredSelected = filteredPeople.every(p => selectedIds.has(p.id));
    const newSet = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredPeople.forEach(p => newSet.delete(p.id));
    } else {
      filteredPeople.forEach(p => newSet.add(p.id));
    }
    setSelectedIds(newSet);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const addPerson = async () => {
    if (!user) return;
    try {
      const newExpert = {
        name: '',
        cccd: '',
        certificate: '',
        ownerId: user.uid,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'experts'), newExpert);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'experts');
    }
  };

  const removePerson = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'experts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `experts/${id}`);
    }
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson({ ...person });
  };

  const saveEditedPerson = async () => {
    if (editingPerson && user) {
      try {
        const { id, ...data } = editingPerson;
        await updateDoc(doc(db, 'experts', id), {
          ...data,
          updatedAt: new Date().toISOString()
        });
        setEditingPerson(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `experts/${editingPerson.id}`);
      }
    }
  };

  const handleExportWord = async () => {
    try {
      if (selectedPeople.length === 0) {
        alert('Vui lòng chọn ít nhất một nhân sự để xuất file.');
        return;
      }
      console.log('Bắt đầu xuất Word cho', selectedPeople.length, 'người');
      setIsExportingWord(true);
      await exportToWord(selectedPeople, packageName, decision, day, month, year);
      console.log('Xuất Word thành công');
    } catch (error) {
      console.error('Lỗi xuất Word:', error);
      alert('Có lỗi xảy ra khi xuất Word: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsExportingWord(false);
    }
  };
  const filteredPeople = people.filter(p => 
    selectedFilterNames.length === 0 || selectedFilterNames.includes(p.name)
  );

  const selectedPeople = filteredPeople.filter(p => selectedIds.has(p.id));
  const previewPerson = selectedPeople.length > 0 ? selectedPeople[0] : people[0];

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-6 max-w-xs text-center">
          <div className="w-12 h-12 border-4 border-[#0284c7] border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2">
            <p className="text-zinc-700 font-bold">Đang tải hệ thống...</p>
            {authTimeout && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-xs text-zinc-600">Quá trình tải đang mất nhiều thời gian hơn dự kiến. Vui lòng thử tải lại trang.</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="h-12 rounded-2xl border-zinc-200 text-zinc-600 font-bold px-6"
                >
                  Tải lại trang
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 p-6">
        <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-zinc-100 overflow-hidden">
          <div className="p-12 flex flex-col items-center text-center gap-6">
            <div className="p-6 bg-red-100 rounded-3xl">
              <X className="w-12 h-12 text-red-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-zinc-900">Đã xảy ra lỗi</h1>
              <p className="text-zinc-700">{error}</p>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full h-14 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-2xl font-bold"
            >
              Thử lại
            </Button>
            <Button 
              variant="ghost"
              onClick={logout}
              className="w-full h-14 text-zinc-600 hover:text-zinc-800 font-bold"
            >
              Đăng xuất
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 p-6">
        <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-zinc-100 overflow-hidden">
          <div className="p-12 flex flex-col items-center text-center gap-8">
            <div className="p-6 bg-[#0284c7] rounded-3xl shadow-2xl shadow-[#0284c7]/30">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Tạo Bản Cam Kết</h1>
              <p className="text-zinc-700">Vui lòng đăng nhập để lưu trữ dữ liệu vĩnh viễn và truy cập từ mọi thiết bị.</p>
            </div>
            <Button 
              onClick={loginWithGoogle}
              className="w-full h-16 bg-white hover:bg-zinc-50 text-zinc-900 border-2 border-zinc-100 rounded-2xl font-bold text-lg flex items-center justify-center gap-4 shadow-sm transition-all active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
              Đăng nhập với Google
            </Button>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">An toàn • Bảo mật • Vĩnh viễn</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden font-sans selection:bg-[#0284c7]/20 selection:text-[#0369a1] text-zinc-900">
      {/* Sidebar / Controls - Hidden when printing */}
      <div className="w-[420px] flex flex-col border-r border-zinc-200 bg-white print:hidden shadow-sm z-10">
        <div className="p-6 bg-white border-b border-zinc-100 shrink-0 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-zinc-900">
              <div className="p-2 bg-[#0284c7] rounded-xl shadow-lg shadow-[#0284c7]/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              Tạo Bản Cam Kết
            </h1>
            <p className="text-xs text-zinc-500 mt-2 font-medium italic">Hệ thống quản lý bản cam kết chuyên gia</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
              onClick={resetData}
              title="Xóa dữ liệu và đặt lại"
            >
              <Plus className="w-5 h-5 rotate-45" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-zinc-400 hover:text-[#f43f5e] hover:bg-[#f43f5e]/10 rounded-xl transition-all"
              onClick={logout}
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 flex flex-col gap-4">
            {/* Section 1: Thông tin gói thầu */}
            <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white shrink-0">
              <CardHeader className="py-3 px-5 bg-yellow-400 border-b border-yellow-500">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
                  1. Thông tin gói thầu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                  <Label htmlFor="packageName" className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Tên gói thầu (3)</Label>
                  <Input 
                    id="packageName" 
                    placeholder="Nhập tên gói thầu..." 
                    value={packageName} 
                    onChange={e => setPackageName(e.target.value)} 
                    className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-[#0284c7] focus:ring-4 focus:ring-[#0284c7]/10 shadow-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-400 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decision" className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Quyết định thành lập (4)</Label>
                  <Input 
                    id="decision" 
                    placeholder="Nhập số quyết định..." 
                    value={decision} 
                    onChange={e => setDecision(e.target.value)} 
                    className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-[#0284c7] focus:ring-4 focus:ring-[#0284c7]/10 shadow-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-400 px-4"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Kho dữ liệu chuyên gia */}
            <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white shrink-0">
              <CardHeader className="py-3 px-5 bg-yellow-400 border-b border-yellow-500 flex flex-row items-center justify-between shrink-0">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
                  2. Tổ chuyên gia ({people.length})
                </CardTitle>
                <Button variant="secondary" size="sm" onClick={addPerson} className="h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-all font-bold px-3 text-xs uppercase tracking-wider">
                  <Plus className="w-3 h-3 mr-1" /> Thêm mới
                </Button>
              </CardHeader>
              <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" className="w-full h-10 justify-between rounded-xl border-zinc-200 bg-white text-xs hover:bg-zinc-50 focus:bg-white focus:border-[#0284c7] shadow-none font-bold text-zinc-700 transition-all px-4" />
                    }
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">
                        {selectedFilterNames.length === 0 
                          ? "Lọc nhân sự..." 
                          : `Đã chọn ${selectedFilterNames.length} người`}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 opacity-50 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[320px] rounded-2xl shadow-2xl border-zinc-100 p-0 bg-white" align="start">
                    <div className="p-3 border-b border-zinc-50 sticky top-0 bg-white z-10">
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                          <Input 
                            placeholder="Tìm tên nhân sự..." 
                            value={filterSearchTerm}
                            onChange={(e) => setFilterSearchTerm(e.target.value)}
                            className="h-10 pl-9 pr-9 text-sm rounded-xl border-zinc-100 bg-zinc-50 focus-visible:ring-[#0284c7]/20 text-zinc-900 font-medium"
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          {filterSearchTerm && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent text-zinc-400 hover:text-zinc-600"
                              onClick={() => setFilterSearchTerm('')}
                            >
                              <Plus className="w-4 h-4 rotate-45" />
                            </Button>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-xl shrink-0"
                          onClick={() => setIsFilterOpen(false)}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2">
                      {Array.from(new Set(people.map(p => p.name).filter(Boolean)))
                        .filter((name: string) => name.toLowerCase().includes(filterSearchTerm.toLowerCase()))
                        .map((name: string) => (
                          <DropdownMenuCheckboxItem
                            key={name}
                            checked={selectedFilterNames.includes(name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFilterNames([...selectedFilterNames, name]);
                              } else {
                                setSelectedFilterNames(selectedFilterNames.filter(n => n !== name));
                              }
                            }}
                            onSelect={(e) => e.preventDefault()}
                            className="py-2.5 px-4 text-sm font-medium rounded-xl focus:bg-[#0284c7]/10 focus:text-[#0284c7] text-zinc-700"
                          >
                            {name}
                          </DropdownMenuCheckboxItem>
                        ))}
                      {people.filter(p => p.name && p.name.toLowerCase().includes(filterSearchTerm.toLowerCase())).length === 0 && (
                        <div className="p-6 text-xs text-zinc-400 text-center italic font-medium">Không tìm thấy kết quả</div>
                      )}
                    </div>
                    <div className="p-2 border-t border-zinc-50 bg-zinc-50/30">
                      <Button 
                        variant="ghost" 
                        className="w-full h-10 text-xs text-zinc-400 hover:text-[#0284c7] hover:bg-[#0284c7]/5 font-bold justify-center rounded-xl transition-all uppercase tracking-wider"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        <X className="w-3 h-3 mr-2" /> Đóng bộ lọc
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="p-0">
                <Table className="border-collapse">
                  <TableHeader className="bg-zinc-50/50 border-b border-zinc-100 sticky top-0 z-20 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-zinc-100">
                      <TableHead className="w-[44px] text-center px-1 py-2">
                        <Checkbox 
                           checked={selectedIds.size === people.length && people.length > 0}
                           onCheckedChange={toggleSelectAll}
                           className="w-4 h-4 border-zinc-300 data-[state=checked]:bg-[#0284c7] data-[state=checked]:border-[#0284c7] rounded-md"
                        />
                      </TableHead>
                      <TableHead className="font-bold text-zinc-700 text-xs py-2 uppercase tracking-wider">Họ tên & CCCD</TableHead>
                      <TableHead className="w-[80px] text-center font-bold text-zinc-700 text-xs py-2 uppercase tracking-wider">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataLoading && (
                      <TableRow className="border-zinc-100">
                        <TableCell colSpan={3} className="p-8 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-6 h-6 border-2 border-[#0284c7] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Đang tải...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!dataLoading && people.length === 0 && (
                      <TableRow className="border-zinc-100">
                        <TableCell colSpan={3} className="p-8 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-zinc-50 rounded-xl">
                              <Search className="w-6 h-6 text-zinc-300" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-700 font-bold">Danh sách trống</p>
                              <p className="text-xs text-zinc-400">Vui lòng thêm chuyên gia</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!dataLoading && filteredPeople.map((p, index) => (
                      <TableRow key={p.id} className={`group border-b border-zinc-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'} hover:bg-[#0284c7]/5`}>
                        <TableCell className="text-center px-1 py-3">
                          <Checkbox 
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => toggleSelect(p.id)}
                            className="w-4 h-4 border-zinc-300 data-[state=checked]:bg-[#0284c7] data-[state=checked]:border-[#0284c7] rounded-md"
                          />
                        </TableCell>
                        <TableCell className="py-3 pr-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-900 truncate max-w-[180px]">{p.name || 'Chưa nhập tên'}</span>
                            <span className="text-xs font-medium text-zinc-600 font-mono tracking-wider">{p.cccd || 'Số CCCD...'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Dialog>
                              <DialogTrigger
                                render={
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-zinc-400 hover:text-[#0284c7] hover:bg-[#0284c7]/10 rounded-lg"
                                    onClick={() => handleEditPerson(p)}
                                  />
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[550px] rounded-[2rem] bg-white border-zinc-100 shadow-2xl p-8 text-zinc-900">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">Chỉnh sửa thông tin</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-6">
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Họ và tên</Label>
                                    <Input 
                                      id="edit-name" 
                                      value={editingPerson?.name || ''} 
                                      onChange={e => setEditingPerson(prev => prev ? {...prev, name: e.target.value} : null)}
                                      className="h-12 rounded-xl bg-zinc-50 border-zinc-100 text-zinc-900 font-bold text-base px-5 focus:bg-white focus:ring-4 focus:ring-[#0284c7]/10 transition-all"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-cccd" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Số CCCD</Label>
                                    <Input 
                                      id="edit-cccd" 
                                      value={editingPerson?.cccd || ''} 
                                      onChange={e => setEditingPerson(prev => prev ? {...prev, cccd: e.target.value} : null)}
                                      className="h-12 rounded-xl bg-zinc-50 border-zinc-100 text-zinc-900 font-bold text-base px-5 focus:bg-white focus:ring-4 focus:ring-[#0284c7]/10 transition-all"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-cert" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chứng chỉ nghiệp vụ</Label>
                                    <textarea 
                                      id="edit-cert" 
                                      value={editingPerson?.certificate || ''} 
                                      onChange={e => setEditingPerson(prev => prev ? {...prev, certificate: e.target.value} : null)}
                                      className="w-full min-h-[120px] rounded-xl border border-zinc-100 bg-zinc-50 p-5 text-base text-zinc-900 font-bold focus:bg-white focus:ring-4 focus:ring-[#0284c7]/10 outline-none transition-all resize-none"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button onClick={saveEditedPerson} className="h-12 w-full bg-[#0284c7] hover:bg-[#0369a1] rounded-xl font-bold text-white text-base shadow-lg shadow-[#0284c7]/20 transition-all active:scale-[0.98]">Lưu thay đổi</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-zinc-400 hover:text-[#f43f5e] hover:bg-[#f43f5e]/10 rounded-lg"
                              onClick={() => removePerson(p.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Section 3: Ngày cam kết */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden shrink-0">
              <div className="py-3 px-5 bg-yellow-400 border-b border-yellow-500">
                <Label className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  3. Ngày cam kết
                </Label>
              </div>
              <div className="p-5 flex gap-3">
                <Input id="day" value={day} onChange={e => setDay(e.target.value)} placeholder="Ngày" maxLength={2} className="h-12 rounded-xl text-center font-bold text-zinc-900 bg-zinc-50/50 border-zinc-100 text-sm placeholder:text-zinc-400 focus:bg-white transition-all" />
                <Input id="month" value={month} onChange={e => setMonth(e.target.value)} placeholder="Tháng" maxLength={2} className="h-12 rounded-xl text-center font-bold text-zinc-900 bg-zinc-50/50 border-zinc-100 text-sm placeholder:text-zinc-400 focus:bg-white transition-all" />
                <Input id="year" value={year} onChange={e => setYear(e.target.value)} placeholder="Năm" maxLength={4} className="h-12 rounded-xl text-center font-bold text-zinc-900 bg-zinc-50/50 border-zinc-100 text-sm placeholder:text-zinc-400 focus:bg-white transition-all" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-white flex flex-col gap-4 shrink-0">
          <Button 
            className="w-full h-14 text-base font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-lg shadow-[#0284c7]/20 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98]" 
            onClick={handleExportWord}
            disabled={selectedPeople.length === 0 || isExportingWord}
          >
            <FileDown className={`w-5 h-5 mr-3 ${isExportingWord ? 'animate-spin' : ''}`} />
            {isExportingWord ? 'Đang xuất Word...' : `Xuất Word (${selectedPeople.length} bản)`}
          </Button>
        </div>
      </div>

      {/* Preview Area - Visible on screen */}
      <div className="flex-1 overflow-hidden flex flex-col bg-zinc-50 relative">
        {/* Preview Toolbar */}
        <div className="h-14 bg-white border-b border-zinc-100 flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-md shadow-green-500/30"></div>
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Preview</span>
          </div>
          <div className="flex items-center gap-6 bg-zinc-50/50 p-2 rounded-2xl border border-zinc-100">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-white shadow-sm transition-all" onClick={() => setPreviewScale(prev => Math.max(0.4, prev - 0.1))}>
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-sm font-bold text-zinc-600 w-14 text-center tabular-nums">{Math.round(previewScale * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-white shadow-sm transition-all" onClick={() => setPreviewScale(prev => Math.min(1.5, prev + 0.1))}>
              <ZoomIn className="w-5 h-5" />
            </Button>
            <div className="w-px h-6 bg-zinc-200 mx-2"></div>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-white shadow-sm transition-all" onClick={() => setPreviewScale(0.8)}>
              <Maximize2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-12 flex flex-col items-center gap-12 scroll-smooth bg-zinc-100">
          {selectedPeople.length > 0 ? (
            selectedPeople.map((person, index) => (
              <div 
                key={person.id} 
                className="bg-white shadow-2xl ring-1 ring-black/5 relative transition-all origin-top shrink-0"
                style={{ 
                  width: '210mm', 
                  minHeight: '297mm', 
                  padding: '20mm 20mm 20mm 30mm',
                  transform: `scale(${previewScale})`,
                  marginBottom: `${(297 * previewScale) - 297}mm` // Adjust margin to compensate for scale
                }}
              >
                <div className="absolute top-6 right-6 bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-bold uppercase tracking-widest border border-slate-200">
                  Trang {index + 1}/{selectedPeople.length}
                </div>
                <DocumentContent 
                  person={person} 
                  packageName={packageName} 
                  decision={decision} 
                  day={day} 
                  month={month} 
                  year={year} 
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <div className="p-6 bg-white rounded-3xl shadow-xl border border-zinc-50">
                <FileText className="w-12 h-12 text-slate-200" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-slate-800">Chưa có dữ liệu xem trước</p>
                <p className="text-xs text-slate-500">Vui lòng chọn ít nhất 1 nhân sự ở danh sách bên trái</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentContent({ person, packageName, decision, day, month, year }: { person: Person, packageName: string, decision: string, day: string, month: string, year: string }) {
  return (
    <div className="flex flex-col h-full bg-white text-black antialiased" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '14pt', lineHeight: '1.5' }}>
      <div className="flex justify-between items-start mb-8">
        <div className="whitespace-nowrap text-[14pt]">Số: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/TCG</div>
        <div className="flex flex-col">
          <div className="italic whitespace-nowrap text-center text-[14pt]">
            An Hội Đông, ngày {day ? day : <span className="text-red-600">(6)</span>} tháng {month ? month : <span className="text-red-600">(7)</span>} năm {year ? year : <span className="text-red-600">(8)</span>}
          </div>
          <div className="font-bold text-right text-[14pt]">Phụ lục 06</div>
          <div className="italic text-right text-[14pt]">(Theo TT 79/TT-BTC ngày 04/8/2025)</div>
        </div>
      </div>

      <div className="text-center font-bold text-[16pt] mb-6">
        BẢN CAM KẾT
      </div>

      <div className="mb-2 text-[14pt]" style={{ textIndent: '2rem' }}>
        Tôi tên là: {person.name ? <span className="font-bold">{person.name}</span> : <span className="text-red-600">(1)</span>}
      </div>
      <div className="mb-2 text-[14pt]" style={{ textIndent: '2rem' }}>
        Số Căn cước/CCCD/Hộ chiếu: {person.cccd ? person.cccd : <span className="text-red-600">(2)</span>}
      </div>

      <div className="text-justify mb-2 text-[14pt]" style={{ textIndent: '2rem' }}>
        Là thành viên của tổ chuyên gia đánh giá E-HSDT/hồ sơ dự thầu gói thầu “{packageName ? packageName : <span className="text-red-600">(3)</span>}” theo {decision ? decision : <span className="text-red-600">(4)</span>} của Công ty Điện lực Gia Định. Tôi được cấp chứng chỉ nghiệp vụ chuyên môn về đấu thầu số: {person.certificate ? person.certificate : <span className="text-red-600">(5)</span>}.
      </div>

      <div className="mb-2 text-[14pt]" style={{ textIndent: '2rem' }}>Tôi cam kết như sau:</div>

      <div className="text-justify mb-2 text-[14pt]" style={{ textIndent: '2rem' }}>
        - Được đào tạo theo quy định của pháp luật hiện hành, có đầy đủ bằng cấp, chứng chỉ chuyên môn phù hợp và có năng lực, kinh nghiệm để đánh giá E-HSDT đối với gói thầu đang xét;
      </div>
      <div className="text-justify mb-2 text-[14pt]" style={{ textIndent: '2rem' }}>
        - Đánh giá E-HSDT trên cơ sở trung thực, khách quan, công bằng, không chịu bất kỳ sự ràng buộc về lợi ích đối với các bên;
      </div>
      <div className="text-justify mb-2 text-[14pt]" style={{ textIndent: '2rem' }}>
        - Chịu trách nhiệm trước pháp luật về kết quả đánh giá E-HSDT của mình;
      </div>
      <div className="text-justify mb-2 text-[14pt]" style={{ textIndent: '2rem' }}>
        - Bảo mật các thông tin và hồ sơ, tài liệu trong quá trình đánh giá E-HSDT theo đúng quy định của pháp luật;
      </div>
      <div className="text-justify mb-2 text-[14pt]" style={{ textIndent: '2rem' }}>
        - Không vi phạm các quy định về bảo đảm cạnh tranh.
      </div>

      <div className="text-justify mb-6 text-[14pt]" style={{ textIndent: '2rem' }}>
        Nếu tôi vi phạm nội dung cam kết nêu trên, tôi xin chịu trách nhiệm trước pháp luật./.
      </div>

      <div className="flex justify-end mb-8">
        <div className="text-center w-[400px]">
          <div className="mb-1 text-[14pt]">An Hội Đông, ngày {day ? day : <span className="text-red-600">(6)</span>} tháng {month ? month : <span className="text-red-600">(7)</span>} năm {year ? year : <span className="text-red-600">(8)</span>}</div>
          <div className="font-bold text-[14pt]">Người cam kết</div>
          <div className="italic mb-32 text-[14pt]">(Ký và ghi rõ họ tên)</div>
          <div className="font-bold text-[14pt]">{person.name ? person.name : <span className="text-red-600">(1)</span>}</div>
        </div>
      </div>
    </div>
  );
}
