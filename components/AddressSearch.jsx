import { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { MapPinIcon, SearchIcon } from "lucide-react";

// Mock address data for demo
const MOCK_ADDRESSES = [
    { zipCode: "06234", address: "서울특별시 강남구 테헤란로 152" },
    { zipCode: "06235", address: "서울특별시 강남구 테헤란로 154" },
    { zipCode: "06236", address: "서울특별시 강남구 테헤란로 156" },
    { zipCode: "04542", address: "서울특별시 중구 명동길 74" },
    { zipCode: "04543", address: "서울특별시 중구 명동길 76" },
];

export default function AddressSearch({ value, onChange, error }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        const results = MOCK_ADDRESSES.filter(addr =>
            addr.address.includes(searchQuery)
        );
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleSelectAddress = (selectedAddress) => {
        onChange({
            ...value,
            zipCode: selectedAddress.zipCode,
            address: selectedAddress.address
        });
        setIsOpen(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50"
        >
            <div className="flex items-center gap-2 mb-3">
                <MapPinIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">주소 정보</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">우편번호</label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="우편번호"
                            value={value.zipCode}
                            readOnly
                            className="bg-white/80"
                        />
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="shrink-0 bg-white/80">
                                    검색
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>주소 검색</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="도로명, 건물명, 지번을 입력하세요"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                        <Button onClick={handleSearch} disabled={isSearching}>
                                            {isSearching ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                                />
                                            ) : (
                                                <SearchIcon className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>

                                    <AnimatePresence>
                                        {searchResults.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-2 max-h-60 overflow-y-auto"
                                            >
                                                {searchResults.map((result, index) => (
                                                    <motion.div
                                                        key={result.zipCode}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                                        onClick={() => handleSelectAddress(result)}
                                                    >
                                                        <div className="font-medium text-sm">[{result.zipCode}]</div>
                                                        <div className="text-sm text-slate-600">{result.address}</div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-slate-700">주소</label>
                    <Input
                        type="text"
                        placeholder="주소 검색 버튼을 눌러 주소를 선택하세요"
                        value={value.address}
                        readOnly
                        className="bg-white/80"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">상세주소</label>
                <Input
                    type="text"
                    placeholder="상세주소를 입력하세요 (동, 호수 등)"
                    value={value.detailAddress}
                    onChange={(e) => onChange({ ...value, detailAddress: e.target.value })}
                    className="bg-white/80"
                />
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center gap-1"
                >
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {error}
                </motion.p>
            )}
        </motion.div>
    );
}