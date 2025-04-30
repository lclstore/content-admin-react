import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal,Tabs, message, Form, Table, Switch,Space,Button } from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDateRange } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import Temlates from './components/Temlates';
import Resources from './components/Resources';
import TagSelector from '@/components/TagSelector/TagSelector';
import { STATUS_ICON_MAP, RESULT_ICON_MAP, FILE_STATUS_ICON_MAP } from '@/constants/app';
import {
    statusOrder,
    difficultyOrder,
    mockWorkoutsForList,
    filterSections,
    BATCH_FILE_OPTIONS,
    MOCK_LANG_OPTIONS
} from './Data';

export default function WorkoutsList() {
    const onChange = key => {
        console.log(key);
      };
      const items = [
        {
          key: '1',
          label: 'Temlates',
          children: <Temlates></Temlates>,
        },
        {
          key: '2',
          label: 'Resources',
          children: <Resources></Resources>,
        },
        {
          key: '3',
          label: 'Tab 3',
          children: 'Content of Tab Pane 3',
        },
      ];
      return <Tabs defaultActiveKey="1" items={items} onChange={onChange} />;
}   