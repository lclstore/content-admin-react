import React, { useState, useMemo, useCallback } from 'react';
import {
    Input,
    Button,
    List,
    Avatar,
    Typography,
    Badge
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    FilterOutlined,
    CaretRightOutlined
} from '@ant-design/icons';
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
import './ContentLibrary.css';

const { Text } = Typography;

const contentLibraryFilterSections = [
    {
        title: 'Status',
        key: 'status',
        options: ['Draft', 'Enabled', 'Disabled', 'Deprecated'],
    },
    {
        title: 'Function Type',
        key: 'functionType',
        options: ['Main', 'Warm Up', 'Cool Down'],
    },
    {
        title: 'Difficulty',
        key: 'difficulty',
        options: ['Beginner', 'Intermediate', 'Advanced'],
    },
    {
        title: 'Position',
        key: 'position',
        options: ['Standing', 'Lying', 'Seated', 'Prone'],
    },
    {
        title: 'Target',
        key: 'target',
        options: ['Core', 'Arm', 'Butt', 'Leg', 'Thigh', 'Face Muscles', 'Abs', 'Hip', 'Back', 'Shoulder', 'Chest', 'Spine', 'Lower back', 'Total body', 'Upper body', 'Lower body'],
    },

];

const ContentLibraryPanel = ({ contentLibraryData, onAddItem, onFilterChange, onSearchChange, searchValue, hasActiveFilters, activeFilters }) => {
    const handleFilterUpdate = useCallback((newFilters) => {
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    }, [onFilterChange]);

    const handleFilterReset = useCallback(() => {
        const resetFilters = { functionType: [], difficulty: [], position: [], target: [], status: [] };
        if (onFilterChange) {
            onFilterChange(resetFilters);
        }
    }, [onFilterChange]);


    return (
        <div className="content-library-panel">
            <div className="content-library-search">
                <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search content display name..."
                    className="content-library-search-input"
                    value={searchValue}
                    onChange={onSearchChange}
                    allowClear
                />
                <FiltersPopover
                    filterSections={contentLibraryFilterSections}
                    onUpdate={handleFilterUpdate}
                    onReset={handleFilterReset}
                    activeFilters={activeFilters}
                >
                    <Badge dot={hasActiveFilters} offset={[-8, 5]}>
                        <Button icon={<FilterOutlined />}>
                            Filters
                        </Button>
                    </Badge>
                </FiltersPopover>
            </div>
            <List
                itemLayout="horizontal"
                dataSource={Array.isArray(contentLibraryData) ? contentLibraryData : []}
                className="content-library-list"
                renderItem={(item) => (
                    <List.Item
                        key={item.id}
                        className="content-library-item"
                        actions={
                            item.status === 'Enabled'
                                ? [<Button type="text" shape="circle" icon={<PlusOutlined />} onClick={() => onAddItem(item)} title="Add to structure" />]
                                : []
                        }
                    >
                        <List.Item.Meta
                            avatar={
                                <div className="content-library-item-avatar">
                                    <Avatar shape="square" size={64} src={item.animationPhoneUrl} />
                                    <CaretRightOutlined
                                        className="content-library-item-play-icon"
                                    />
                                </div>
                            }
                            title={<Text ellipsis={{ tooltip: item.displayName }}>{item.displayName}</Text>}
                            description={<Text type="secondary" ellipsis={{ tooltip: item.equipment }}>{item.equipment}</Text>}
                        />
                    </List.Item>
                )}
            />
        </div>
    );
};

export default ContentLibraryPanel; 