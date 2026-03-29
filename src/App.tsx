import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Filter, ChevronDown, FileText, FileDown, Search, Edit, ZoomIn, ZoomOut, Maximize2, X, Upload, Download, RotateCcw } from 'lucide-react';
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
import * as XLSX from 'xlsx';

interface Person {
  id: string;
  name: string;
  cccd: string;
  certificate: string;
}

const INITIAL_PEOPLE: Person[] = [];

const DEEP_BLACK = '#000000';
const DEEP_BLACK_HOVER = '#1A1A1A';

export default function App() {
  // Local persistence keys
  const STORAGE_KEY_PEOPLE = 'camket_people';
  const STORAGE_KEY_FORM = 'camket_form';

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

  // Load from localStorage on mount
  useEffect(() => {
    const savedPeople = localStorage.getItem(STORAGE_KEY_PEOPLE);
    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    } else {
      setPeople(INITIAL_PEOPLE);
    }

    const savedForm = localStorage.getItem(STORAGE_KEY_FORM);
    if (savedForm) {
      const form = JSON.parse(savedForm);
      setPackageName(form.packageName || '');
      setDecision(form.decision || '');
      setDay(form.day || '');
      setMonth(form.month || '');
      setYear(form.year || '');
      setSelectedIds(new Set(form.selectedIds || []));
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify({
      packageName, decision, day, month, year, selectedIds: Array.from(selectedIds)
    }));
  }, [packageName, decision, day, month, year, selectedIds]);

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

  const addPerson = () => {
    const newPerson: Person = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      cccd: '',
      certificate: ''
    };
    setPeople([...people, newPerson]);
    setEditingPerson(newPerson);
  };

  const removePerson = (id: string) => {
    setPeople(people.filter(p => p.id !== id));
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson({ ...person });
  };

  const saveEditedPerson = () => {
    if (editingPerson) {
      setPeople(people.map(p => p.id === editingPerson.id ? editingPerson : p));
      setEditingPerson(null);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Họ và tên': 'Nguyễn Văn A', 'Số CCCD': '012345678901', 'Chứng chỉ nghiệp vụ': 'Chứng chỉ số 123...' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách chuyên gia");
    XLSX.writeFile(wb, "Bieu_mau_nhap_lieu_chuyen_gia.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const newPeople = data.map((row: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: row['Họ và tên'] || row['Name'] || '',
        cccd: row['Số CCCD'] || row['ID'] || '',
        certificate: row['Chứng chỉ nghiệp vụ'] || row['Certificate'] || ''
      })).filter(p => p.name || p.cccd);

      setPeople(newPeople);
      setSelectedIds(new Set());
      alert(`Đã nhập thành công ${newPeople.length} chuyên gia.`);
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  const handleExportWord = async () => {
    try {
      if (selectedPeople.length === 0) {
        alert('Vui lòng chọn ít nhất một nhân sự để xuất file.');
        return;
      }
      setIsExportingWord(true);
      await exportToWord(selectedPeople, packageName, decision, day, month, year);
    } catch (error) {
      console.error('Lỗi xuất Word:', error);
      alert('Có lỗi xảy ra khi xuất Word: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsExportingWord(false);
    }
  };

  const filteredPeople = people.filter(p => 
    (selectedFilterNames.length === 0 || selectedFilterNames.includes(p.name)) &&
    (p.name.toLowerCase().includes(filterSearchTerm.toLowerCase()) || p.cccd.includes(filterSearchTerm))
  );

  const selectedPeople = filteredPeople.filter(p => selectedIds.has(p.id));

  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden font-sans selection:bg-[#000000]/10 selection:text-zinc-900 text-zinc-900">
      {/* Sidebar / Controls */}
      <div className="w-[420px] flex flex-col border-r border-zinc-200 bg-white print:hidden shadow-sm z-10">
        <div className="p-6 bg-white border-b border-zinc-100 shrink-0 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-zinc-900">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-[#166534]/20">
                <img src="./app-icon-v3-192x192.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              Tạo Bản Cam Kết
            </h1>
            <p className="text-xs text-zinc-500 mt-2 font-medium italic">Hệ thống tạo nhanh Cam kết Tổ chuyên gia</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 flex flex-col gap-4">
            {/* Section 1: Thông tin gói thầu */}
            <Card className="border-2 border-yellow-400/50 shadow-md rounded-2xl overflow-hidden bg-white shrink-0 transition-all hover:shadow-2xl hover:scale-[1.01] hover:border-yellow-400">
              <CardHeader className="py-3 px-5 bg-yellow-400 border-b border-yellow-500 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">1</div>
                  Thông tin gói thầu
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setPackageName(''); setDecision(''); }}
                  className="h-8 w-8 p-0 text-zinc-900 hover:bg-zinc-900/10 rounded-lg"
                  title="Nhập mới"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 p-5 bg-zinc-50/30">
                <div className="space-y-2">
                  <Label htmlFor="packageName" className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Tên gói thầu</Label>
                  <Input 
                    id="packageName" 
                    placeholder="Nhập tên gói thầu..." 
                    value={packageName} 
                    onChange={e => setPackageName(e.target.value)} 
                    className="h-12 rounded-xl border-zinc-200 bg-white focus:border-[#000000] focus:ring-4 focus:ring-[#000000]/10 shadow-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-400 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decision" className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Quyết định thành lập</Label>
                  <Input 
                    id="decision" 
                    placeholder="Nhập số quyết định..." 
                    value={decision} 
                    onChange={e => setDecision(e.target.value)} 
                    className="h-12 rounded-xl border-zinc-200 bg-white focus:border-[#000000] focus:ring-4 focus:ring-[#000000]/10 shadow-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-400 px-4"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Tổ chuyên gia */}
            <Card className="border-2 border-yellow-400/50 shadow-md rounded-2xl overflow-hidden bg-white shrink-0 transition-all hover:shadow-2xl hover:scale-[1.01] hover:border-yellow-400">
              <CardHeader className="py-3 px-5 bg-yellow-400 border-b border-yellow-500 flex flex-row items-center justify-between shrink-0">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">2</div>
                  Tổ chuyên gia
                </CardTitle>
                <Dialog>
                  <DialogTrigger render={<Button variant="secondary" size="sm" onClick={addPerson} className="h-8 rounded-lg bg-[#000000] hover:bg-[#1A1A1A] text-white transition-all font-bold px-3 text-xs uppercase tracking-wider" />}>
                    <Plus className="w-3 h-3 mr-1" /> Thêm mới
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px] rounded-[2rem] bg-white border-zinc-100 shadow-2xl p-8 text-zinc-700">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-zinc-700 tracking-tight">Thêm/Sửa chuyên gia</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-name" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Họ và tên</Label>
                        <Input 
                          id="edit-name" 
                          value={editingPerson?.name || ''} 
                          onChange={e => setEditingPerson(prev => prev ? {...prev, name: e.target.value} : null)}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-100 text-zinc-600 font-medium text-base px-5 focus:bg-white focus:ring-4 focus:ring-[#166534]/10 transition-all"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-cccd" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Số CCCD</Label>
                        <Input 
                          id="edit-cccd" 
                          value={editingPerson?.cccd || ''} 
                          onChange={e => setEditingPerson(prev => prev ? {...prev, cccd: e.target.value} : null)}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-100 text-zinc-600 font-medium text-base px-5 focus:bg-white focus:ring-4 focus:ring-[#166534]/10 transition-all"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-cert" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chứng chỉ nghiệp vụ</Label>
                        <textarea 
                          id="edit-cert" 
                          value={editingPerson?.certificate || ''} 
                          onChange={e => setEditingPerson(prev => prev ? {...prev, certificate: e.target.value} : null)}
                          className="w-full min-h-[120px] rounded-xl border border-zinc-100 bg-zinc-50 p-5 text-base text-zinc-600 font-medium focus:bg-white focus:ring-4 focus:ring-[#166534]/10 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                    <DialogFooter className="p-0 mt-4 sm:justify-center">
                      <DialogClose render={<Button onClick={saveEditedPerson} className="h-12 w-full bg-[#166534] hover:bg-[#14532d] rounded-xl font-bold text-white text-base shadow-lg transition-all active:scale-[0.98]" />}>
                        Lưu thay đổi
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              
              <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <Input 
                    placeholder="Lọc nhân sự..." 
                    value={filterSearchTerm}
                    onChange={(e) => setFilterSearchTerm(e.target.value)}
                    className="h-10 pl-9 pr-4 text-xs rounded-xl border-zinc-200 bg-white focus:bg-white focus:border-zinc-900 shadow-none font-medium text-zinc-700 transition-all"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={downloadTemplate} className="flex-1 h-9 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-[10px] font-bold uppercase tracking-wider transition-all">
                    <Download className="w-3 h-3 mr-1.5" /> Tải biểu mẫu
                  </Button>
                  <div className="flex-1 relative">
                    <Button variant="secondary" size="sm" className="w-full h-9 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-[10px] font-bold uppercase tracking-wider transition-all">
                      <Upload className="w-3 h-3 mr-1.5" /> Nhập Excel
                    </Button>
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      onChange={handleFileUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="p-0">
                <Table className="border-collapse">
                  <TableHeader className="bg-zinc-50/50 border-b border-zinc-100 sticky top-0 z-20 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-zinc-100">
                      <TableHead className="w-[44px] text-center px-1 py-2">
                        <Checkbox 
                           checked={filteredPeople.length > 0 && filteredPeople.every(p => selectedIds.has(p.id))}
                           onCheckedChange={toggleSelectAll}
                           className="w-4 h-4 border-zinc-300 data-[state=checked]:bg-[#166534] data-[state=checked]:border-[#166534] rounded-md"
                        />
                      </TableHead>
                      <TableHead className="font-bold text-zinc-700 text-[11px] py-2 uppercase tracking-wider">Tổ chuyên gia</TableHead>
                      <TableHead className="w-[80px] text-center font-bold text-zinc-700 text-[11px] py-2 uppercase tracking-wider">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPeople.length === 0 && (
                      <TableRow className="border-zinc-100">
                        <TableCell colSpan={3} className="p-8 text-center">
                          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider italic">Không tìm thấy kết quả</p>
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredPeople.map((p, index) => (
                      <TableRow 
                        key={p.id} 
                        className={`group border-b border-zinc-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'} hover:bg-[#166534]/5 cursor-pointer`}
                        onClick={() => toggleSelect(p.id)}
                      >
                        <TableCell className="text-center px-1 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => toggleSelect(p.id)}
                            className="w-4 h-4 border-zinc-300 data-[state=checked]:bg-[#166534] data-[state=checked]:border-[#166534] rounded-md"
                          />
                        </TableCell>
                        <TableCell className="py-3 pr-2">
                          <span className="text-sm font-bold text-zinc-900 truncate max-w-[180px] block">
                            {p.name || 'Chưa nhập tên'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Dialog>
                              <DialogTrigger render={<Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                                onClick={(e) => { e.stopPropagation(); handleEditPerson(p); }}
                              />}>
                                <Edit className="w-4 h-4" />
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[550px] rounded-[2rem] bg-white border-zinc-100 shadow-2xl p-8 text-zinc-700">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold text-zinc-700 tracking-tight">Chỉnh sửa thông tin</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-6">
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-name" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Họ và tên</Label>
                                    <Input 
                                      id="edit-name" 
                                      value={editingPerson?.name || ''} 
                                      onChange={e => setEditingPerson(prev => prev ? {...prev, name: e.target.value} : null)}
                                      className="h-12 rounded-xl bg-zinc-50 border-zinc-100 text-zinc-600 font-medium text-base px-5 focus:bg-white focus:ring-4 focus:ring-[#166534]/10 transition-all"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-cccd" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Số CCCD</Label>
                                    <Input 
                                      id="edit-cccd" 
                                      value={editingPerson?.cccd || ''} 
                                      onChange={e => setEditingPerson(prev => prev ? {...prev, cccd: e.target.value} : null)}
                                      className="h-12 rounded-xl bg-zinc-50 border-zinc-100 text-zinc-600 font-medium text-base px-5 focus:bg-white focus:ring-4 focus:ring-[#166534]/10 transition-all"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-cert" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chứng chỉ nghiệp vụ</Label>
                                    <textarea 
                                      id="edit-cert" 
                                      value={editingPerson?.certificate || ''} 
                                      onChange={e => setEditingPerson(prev => prev ? {...prev, certificate: e.target.value} : null)}
                                      className="w-full min-h-[120px] rounded-xl border border-zinc-100 bg-zinc-50 p-5 text-base text-zinc-600 font-medium focus:bg-white focus:ring-4 focus:ring-[#166534]/10 outline-none transition-all resize-none"
                                    />
                                  </div>
                                </div>
                                <DialogFooter className="p-0 mt-4 sm:justify-center">
                                  <DialogClose render={<Button onClick={saveEditedPerson} className="h-12 w-full bg-[#166534] hover:bg-[#14532d] rounded-xl font-bold text-white text-base shadow-lg transition-all active:scale-[0.98]" />}>
                                    Lưu thay đổi
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              onClick={(e) => { e.stopPropagation(); removePerson(p.id); }}
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
            <div className="bg-white rounded-2xl border-2 border-yellow-400/50 shadow-md overflow-hidden shrink-0 transition-all hover:shadow-2xl hover:scale-[1.01] hover:border-yellow-400">
              <div className="py-3 px-5 bg-yellow-400 border-b border-yellow-500 flex flex-row items-center justify-between">
                <Label className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">3</div>
                  Ngày cam kết
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setDay(''); setMonth(''); setYear(''); }}
                  className="h-8 w-8 p-0 text-zinc-900 hover:bg-zinc-900/10 rounded-lg"
                  title="Nhập mới"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-5 flex gap-3 bg-zinc-50/30">
                <Input id="day" value={day} onChange={e => setDay(e.target.value)} placeholder="Ngày" maxLength={2} className="h-10 rounded-xl text-center font-bold text-zinc-900 bg-white border-zinc-100 text-xs placeholder:text-zinc-400 focus:bg-white transition-all" />
                <Input id="month" value={month} onChange={e => setMonth(e.target.value)} placeholder="Tháng" maxLength={2} className="h-10 rounded-xl text-center font-bold text-zinc-900 bg-white border-zinc-100 text-xs placeholder:text-zinc-400 focus:bg-white transition-all" />
                <Input id="year" value={year} onChange={e => setYear(e.target.value)} placeholder="Năm" maxLength={4} className="h-10 rounded-xl text-center font-bold text-zinc-900 bg-white border-zinc-100 text-xs placeholder:text-zinc-400 focus:bg-white transition-all" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-white flex flex-col gap-4 shrink-0">
          <Button 
            className="w-full h-14 text-base font-bold bg-yellow-400 hover:bg-yellow-500 text-zinc-900 shadow-lg shadow-yellow-400/20 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98]" 
            onClick={handleExportWord}
            disabled={selectedPeople.length === 0 || isExportingWord}
          >
            <FileDown className={`w-5 h-5 mr-3 ${isExportingWord ? 'animate-spin' : ''}`} />
            {isExportingWord ? 'Đang xuất Word...' : `Xuất Word (${selectedPeople.length} bản)`}
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-zinc-50 relative">
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
                  marginBottom: `${(297 * previewScale) - 297}mm`
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
            An Hội Đông, ngày {day ? day : '...'} tháng {month ? month : '...'} năm {year ? year : '....'}
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
        Là thành viên của tổ chuyên gia đánh giá E-HSDT/hồ sơ dự thầu gói thầu “{packageName ? packageName : '................................'}” theo {decision ? decision : '................................'} của Công ty Điện lực Gia Định. Tôi được cấp chứng chỉ nghiệp vụ chuyên môn về đấu thầu số: {person.certificate ? person.certificate : <span className="text-red-600">(5)</span>}.
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
          <div className="mb-1 text-[14pt]">An Hội Đông, ngày {day ? day : '...'} tháng {month ? month : '...'} năm {year ? year : '....'}</div>
          <div className="font-bold text-[14pt]">Người cam kết</div>
          <div className="italic mb-32 text-[14pt]">(Ký và ghi rõ họ tên)</div>
          <div className="font-bold text-[14pt]">{person.name ? person.name : <span className="text-red-600">(1)</span>}</div>
        </div>
      </div>
    </div>
  );
}
